#!/usr/bin/env python3
from __future__ import annotations

import argparse
from dataclasses import dataclass

import psycopg2
from psycopg2.extras import RealDictCursor

from ai_etl.tag_quality import is_low_quality_tag


GENERIC_TAGS = {
    "book", "chapter", "publication", "science", "technology", "engineering",
    "result", "numbers", "variables", "because", "two", "công nghệ", "kỹ thuật",
    "sách", "giáo trình", "chương", "tài liệu", "ấn phẩm",
}


@dataclass(frozen=True)
class Finding:
    publication_id: int
    title: str
    reason: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Audit AI-generated summaries and tags")
    parser.add_argument("--db-url", required=True)
    parser.add_argument("--limit", type=int, default=200)
    return parser.parse_args()


def is_generic_tag(tag: str) -> bool:
    normalized = " ".join(tag.lower().replace("&", " ").split())
    return normalized in GENERIC_TAGS


def is_catalog_summary(summary: str) -> bool:
    lowered = summary.lower()
    blocked_phrases = (
        "hệ thống ai",
        "lập chỉ mục",
        "metadata",
        "thuộc nhóm",
        "các chủ đề nổi bật gồm",
        "file pdf",
    )
    return any(phrase in lowered for phrase in blocked_phrases)


def main() -> None:
    args = parse_args()
    findings: list[Finding] = []

    conn = psycopg2.connect(args.db_url)
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT
                    p.id,
                    p.title,
                    p.ai_summary,
                    p.ai_target_audience,
                    COALESCE(ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.id IS NOT NULL), ARRAY[]::text[]) AS tags,
                    etl.status AS etl_status,
                    etl.error_message
                FROM public.publications p
                LEFT JOIN public.publication_tags pt ON pt.publication_id = p.id
                LEFT JOIN public.tags t ON t.id = pt.tag_id
                LEFT JOIN ai_engine.publication_etl_runs etl ON etl.publication_id = p.id
                GROUP BY p.id, p.title, p.ai_summary, p.ai_target_audience, etl.status, etl.error_message
                ORDER BY p.id
                LIMIT %s
                """,
                (args.limit,),
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    for row in rows:
        publication_id = int(row["id"])
        title = str(row["title"])
        summary = str(row["ai_summary"] or "").strip()
        tags = [str(tag).strip() for tag in row["tags"] or [] if str(tag).strip()]
        lower_title = title.lower().strip()

        if not summary:
            findings.append(Finding(publication_id, title, "missing ai_summary"))
        elif len(summary) < 180:
            findings.append(Finding(publication_id, title, "ai_summary too short"))
        elif is_catalog_summary(summary):
            findings.append(Finding(publication_id, title, "summary appears to describe catalog metadata/system processing instead of document content"))

        if not row["ai_target_audience"]:
            findings.append(Finding(publication_id, title, "missing ai_target_audience"))

        if len(tags) < 3:
            findings.append(Finding(publication_id, title, "too few tags"))
        elif len(tags) > 5:
            findings.append(Finding(publication_id, title, "too many tags"))

        bad_tags = [
            tag for tag in tags
            if is_generic_tag(tag)
            or tag.lower().strip() == lower_title
            or is_low_quality_tag(tag)
        ]
        if bad_tags:
            findings.append(Finding(publication_id, title, f"low-quality tags: {', '.join(bad_tags)}"))

        if row["etl_status"] == "FAILED":
            findings.append(Finding(publication_id, title, f"ETL failed: {row['error_message'] or ''}".strip()))

    print(f"Audited publications: {len(rows)}")
    print(f"Findings: {len(findings)}")
    for finding in findings:
        print(f"- #{finding.publication_id} {finding.title}: {finding.reason}")


if __name__ == "__main__":
    main()
