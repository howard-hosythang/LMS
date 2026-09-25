#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any

import numpy as np
import psycopg2
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ai_etl.config import load_settings
from ai_etl.db import Database
from ai_etl.llm_client import GeminiClient
from ai_etl.pdf_processing import Chunk
from ai_etl.pipeline import AIEtlPipeline
from ai_etl.tag_quality import align_english_tags, clean_ai_tag, dedupe_quality_tags, normalize_key


FALLBACK_TAGS = [
    "Nội Dung Chuyên Ngành",
    "Kiến Thức Nền Tảng",
    "Phương Pháp Thực Hành",
    "Ứng Dụng Thực Tế",
    "Tư Duy Kỹ Thuật",
    "Kỹ Năng Thực Hành",
    "Phân Tích Hệ Thống",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate missing ai_summary / AI tags from existing "
            "ai_engine.publication_vectors rows without rebuilding vectors."
        )
    )
    parser.add_argument("--publication-id", type=int, action="append", dest="publication_ids")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--sleep-seconds", type=float, default=1.0)
    parser.add_argument("--target-tag-count", type=int, default=5)
    parser.add_argument("--force-summary", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def _vector_to_list(value: Any) -> list[float]:
    if isinstance(value, np.ndarray):
        return value.astype(np.float32).tolist()
    if hasattr(value, "tolist"):
        return value.tolist()
    return [float(item) for item in value]


def find_target_publications(
    database: Database,
    publication_ids: list[int] | None,
    limit: int,
    target_tag_count: int,
    force_summary: bool,
) -> list[dict[str, Any]]:
    id_filter = ""
    params: list[Any] = []
    if publication_ids:
        id_filter = "AND p.id = ANY(%s)"
        params.append(publication_ids)

    summary_filter = "ai_summary IS NULL OR btrim(ai_summary) = ''"
    if force_summary:
        summary_filter = "TRUE"

    limit_clause = ""
    if limit > 0:
        limit_clause = "LIMIT %s"

    sql = f"""
        WITH per_pub AS (
            SELECT
                p.id,
                p.title,
                p.ai_summary,
                p.ai_target_audience,
                COUNT(DISTINCT pv.id) AS vector_count,
                COUNT(DISTINCT pt.tag_id) AS tag_count
            FROM public.publications p
            JOIN ai_engine.publication_vectors pv ON pv.publication_id = p.id
            LEFT JOIN public.publication_tags pt ON pt.publication_id = p.id
            WHERE TRUE
              {id_filter}
            GROUP BY p.id
        )
        SELECT *
        FROM per_pub
        WHERE ({summary_filter})
           OR tag_count < %s
        ORDER BY id
        {limit_clause}
    """
    params.append(target_tag_count)
    if limit > 0:
        params.append(limit)

    with database.connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            columns = [desc[0] for desc in cur.description]
            return [dict(zip(columns, row)) for row in cur.fetchall()]


def load_publication_chunks(database: Database, publication_id: int) -> tuple[list[Chunk], list[list[float]]]:
    with database.connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, chunk_text, embedding
                FROM ai_engine.publication_vectors
                WHERE publication_id = %s
                ORDER BY id ASC
                """,
                (publication_id,),
            )
            rows = cur.fetchall()

    chunks = [Chunk(chunk_id=str(row[0]), text=str(row[1])) for row in rows if str(row[1]).strip()]
    vectors = [_vector_to_list(row[2]) for row in rows if str(row[1]).strip()]
    return chunks, vectors


def existing_tag_count(database: Database, publication_id: int) -> int:
    with database.connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(DISTINCT tag_id) FROM public.publication_tags WHERE publication_id = %s",
                (publication_id,),
            )
            return int(cur.fetchone()[0])


def existing_tag_names(database: Database, publication_id: int) -> list[str]:
    with database.connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT t.name
                FROM public.publication_tags pt
                JOIN public.tags t ON t.id = pt.tag_id
                WHERE pt.publication_id = %s
                ORDER BY t.name
                """,
                (publication_id,),
            )
            return [str(row[0]) for row in cur.fetchall()]


def choose_tags_to_insert(existing_tags: list[str], generated_tags: list[str], needed: int) -> list[str]:
    if needed <= 0:
        return []

    existing_keys = {normalize_key(tag) for tag in existing_tags}
    candidates = dedupe_quality_tags(
        [*generated_tags, *FALLBACK_TAGS],
        publication_context="",
        limit=max(needed + len(existing_tags) + len(generated_tags), 10),
    )

    selected: list[str] = []
    seen_keys = set(existing_keys)
    for tag in candidates:
        clean = clean_ai_tag(tag)
        key = normalize_key(clean)
        if not clean or key in seen_keys:
            continue
        selected.append(clean)
        seen_keys.add(key)
        if len(selected) >= needed:
            break
    return selected


def backfill_one(
    database: Database,
    pipeline: AIEtlPipeline,
    publication: dict[str, Any],
    target_tag_count: int,
    force_summary: bool,
    dry_run: bool,
) -> dict[str, Any]:
    publication_id = int(publication["id"])
    chunks, vectors = load_publication_chunks(database, publication_id)
    if not chunks or not vectors:
        raise ValueError("Publication has no vector chunks")

    representative_chunks = pipeline._select_representative_chunks(  # noqa: SLF001
        chunks=chunks,
        vectors=vectors,
        max_chunks=pipeline.settings.reduce_max_chunks,
    )
    reduce_inputs = pipeline._apply_reduce_budget(representative_chunks)  # noqa: SLF001
    if not reduce_inputs:
        raise ValueError("No representative chunks available for reduce phase")

    with database.connect() as conn:
        publication_context = database.get_publication_context(conn, publication_id)

    reduce_result = pipeline._reduce_with_fallback(reduce_inputs, publication_context)  # noqa: SLF001
    tags = [str(tag) for tag in reduce_result.get("tags", [])]
    current_tags = existing_tag_names(database, publication_id)
    current_tag_count = len(current_tags)
    tags_needed = max(0, target_tag_count - current_tag_count)
    tags_to_insert = choose_tags_to_insert(current_tags, tags, tags_needed)

    summary_missing = not str(publication.get("ai_summary") or "").strip()
    should_update_summary = force_summary or summary_missing

    if dry_run:
        return {
            "publication_id": publication_id,
            "title": publication.get("title"),
            "dry_run": True,
            "summary_would_update": should_update_summary,
            "tags_would_insert": tags_to_insert,
            "ai_target_audience": reduce_result.get("audience"),
            "reduce_inputs": len(reduce_inputs),
        }

    with database.connect() as conn:
        database.ensure_etl_metadata_table(conn)
        if should_update_summary:
            database.update_publication_summary(
                conn,
                publication_id,
                str(reduce_result["master_summary"]),
                str(reduce_result["audience"]),
            )

        tag_ids: list[int] = []
        for tag_name in tags_to_insert:
            tag_ids.append(database.find_or_create_tag_id(conn, tag_name))

        if tag_ids:
            database.insert_publication_tag_links(conn, publication_id, tag_ids)
            database.upsert_tag_translations(
                conn,
                tag_ids=tag_ids,
                translated_names=align_english_tags(tags_to_insert, [str(tag) for tag in reduce_result.get("tags_en", [])]),
                language_code="en",
            )

        database.upsert_publication_file_hash(
            conn,
            publication_id,
            "metadata-from-existing-vectors",
            chunks_count=len(chunks),
            vectors_count=len(vectors),
        )
        conn.commit()

    return {
        "publication_id": publication_id,
        "title": publication.get("title"),
        "summary_updated": should_update_summary,
        "tags_inserted": tags_to_insert,
        "ai_target_audience": reduce_result.get("audience"),
        "chunks": len(chunks),
        "reduce_inputs": len(reduce_inputs),
    }


def main() -> None:
    load_dotenv(ROOT / ".env")
    args = parse_args()
    settings = load_settings()
    database = Database(settings.database_url)
    llm_client = GeminiClient(
        api_key=settings.gemini_api_key,
        cheap_model=settings.gemini_model_cheap,
        premium_model=settings.gemini_model_premium,
        timeout_seconds=settings.llm_timeout_seconds,
        retry_attempts=settings.llm_retry_attempts,
        min_request_interval_seconds=settings.gemini_min_request_interval_seconds,
    )
    pipeline = AIEtlPipeline(settings, database, llm_client, embedding_client=None)  # type: ignore[arg-type]

    targets = find_target_publications(
        database=database,
        publication_ids=args.publication_ids,
        limit=args.limit,
        target_tag_count=args.target_tag_count,
        force_summary=args.force_summary,
    )
    if not targets:
        print(json.dumps({"status": "EMPTY", "processed": 0}, ensure_ascii=False, indent=2))
        return

    processed = 0
    successes = 0
    failures: list[dict[str, Any]] = []

    for publication in targets:
        processed += 1
        publication_id = int(publication["id"])
        try:
            result = backfill_one(
                database=database,
                pipeline=pipeline,
                publication=publication,
                target_tag_count=max(0, args.target_tag_count),
                force_summary=args.force_summary,
                dry_run=args.dry_run,
            )
            successes += 1
            print(json.dumps({"status": "OK", **result}, ensure_ascii=False), flush=True)
        except Exception as exc:
            failure = {
                "publication_id": publication_id,
                "title": publication.get("title"),
                "error": str(exc),
            }
            failures.append(failure)
            print(json.dumps({"status": "FAILED", **failure}, ensure_ascii=False), flush=True)

        time.sleep(max(0.0, args.sleep_seconds))

    print(json.dumps({
        "status": "DONE",
        "processed": processed,
        "successes": successes,
        "failures": failures,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
