#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os

import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor, execute_values

from ai_etl.llm_client import GeminiClient


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Backfill missing English metadata translations")
    parser.add_argument("--db-url", default="")
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--batch-size", type=int, default=20)
    return parser.parse_args()


def build_llm_client() -> GeminiClient:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("GEMINI_API_KEY is required")

    return GeminiClient(
        api_key=api_key,
        cheap_model=os.getenv("AI_ETL_GEMINI_MODEL_CHEAP", "gemini-2.5-flash-lite"),
        premium_model=os.getenv("AI_ETL_GEMINI_MODEL_PREMIUM", ""),
        timeout_seconds=int(os.getenv("AI_ETL_LLM_TIMEOUT_SECONDS", "30")),
        retry_attempts=int(os.getenv("AI_ETL_LLM_RETRY_ATTEMPTS", "2")),
        min_request_interval_seconds=float(os.getenv("AI_ETL_GEMINI_MIN_REQUEST_INTERVAL_SECONDS", "4.0")),
    )


def fetch_missing_terms(
    conn,
    table: str,
    base_id_column: str,
    translation_id_column: str,
    name_column: str,
    translation_table: str,
    limit: int,
):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f"""
            SELECT base.{base_id_column} AS id, base.{name_column} AS name
            FROM public.{table} base
            LEFT JOIN public.{translation_table} tr
              ON tr.{translation_id_column} = base.{base_id_column}
             AND tr.language_code = 'en'
            WHERE tr.{translation_id_column} IS NULL
            ORDER BY base.{base_id_column}
            LIMIT %s
            """,
            (limit,),
        )
        return cur.fetchall()


def upsert_term_translations(conn, translation_table: str, id_column: str, rows: list[tuple[int, str]]):
    if not rows:
        return

    with conn.cursor() as cur:
        execute_values(
            cur,
            f"""
            INSERT INTO public.{translation_table} ({id_column}, language_code, name, created_at, updated_at)
            VALUES %s
            ON CONFLICT ({id_column}, language_code)
            DO UPDATE SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP
            """,
            rows,
            template="(%s, 'en', %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
        )


def fetch_missing_publications(conn, limit: int):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT
                p.id,
                p.title,
                p.subtitle,
                p.description,
                p.ai_summary,
                STRING_AGG(DISTINCT a.name, ', ') AS authors,
                STRING_AGG(DISTINCT c.name, ', ') AS categories
            FROM public.publications p
            LEFT JOIN public.publication_translations pt
              ON pt.publication_id = p.id
             AND pt.language_code = 'en'
            LEFT JOIN public.publication_authors pa ON pa.publication_id = p.id
            LEFT JOIN public.authors a ON a.id = pa.author_id
            LEFT JOIN public.publication_categories pc ON pc.publication_id = p.id
            LEFT JOIN public.categories c ON c.id = pc.category_id
            WHERE pt.publication_id IS NULL
            GROUP BY p.id
            ORDER BY p.id
            LIMIT %s
            """,
            (limit,),
        )
        return cur.fetchall()


def publication_context(row) -> str:
    labels = {
        "Title": row.get("title"),
        "Subtitle": row.get("subtitle"),
        "Description": row.get("description"),
        "Authors": row.get("authors"),
        "Categories": row.get("categories"),
    }
    return "\n".join(f"{key}: {value}" for key, value in labels.items() if value)


def upsert_publication_translation(conn, row, translation):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO public.publication_translations (
                publication_id,
                language_code,
                title,
                subtitle,
                description,
                ai_summary,
                created_at,
                updated_at
            )
            VALUES (%s, 'en', %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (publication_id, language_code)
            DO UPDATE SET
                title = COALESCE(EXCLUDED.title, public.publication_translations.title),
                subtitle = COALESCE(EXCLUDED.subtitle, public.publication_translations.subtitle),
                description = COALESCE(EXCLUDED.description, public.publication_translations.description),
                ai_summary = COALESCE(EXCLUDED.ai_summary, public.publication_translations.ai_summary),
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                row["id"],
                translation.get("title"),
                translation.get("subtitle"),
                translation.get("description"),
                translation.get("ai_summary"),
            ),
        )


def main() -> None:
    load_dotenv()
    args = parse_args()
    db_url = args.db_url or os.getenv("DATABASE_URL", "").strip()
    if not db_url:
        raise SystemExit("DATABASE_URL is required")

    llm_client = build_llm_client()

    with psycopg2.connect(db_url) as conn:
        category_rows = fetch_missing_terms(
            conn,
            table="categories",
            base_id_column="id",
            translation_id_column="category_id",
            name_column="name",
            translation_table="category_translations",
            limit=args.limit,
        )
        if category_rows:
            category_terms = [row["name"] for row in category_rows]
            translated = llm_client.translate_terms(category_terms)
            upsert_term_translations(
                conn,
                "category_translations",
                "category_id",
                [(int(row["id"]), name) for row, name in zip(category_rows, translated)],
            )
            conn.commit()

        tag_rows = fetch_missing_terms(
            conn,
            table="tags",
            base_id_column="id",
            translation_id_column="tag_id",
            name_column="name",
            translation_table="tag_translations",
            limit=args.limit,
        )
        if tag_rows:
            tag_terms = [row["name"] for row in tag_rows]
            translated = llm_client.translate_terms(tag_terms)
            upsert_term_translations(
                conn,
                "tag_translations",
                "tag_id",
                [(int(row["id"]), name) for row, name in zip(tag_rows, translated)],
            )
            conn.commit()

        publication_rows = fetch_missing_publications(conn, args.limit)
        for row in publication_rows:
            translation = llm_client.translate_catalog_metadata(
                publication_context(row),
                str(row.get("ai_summary") or ""),
                [],
            )
            upsert_publication_translation(conn, row, translation)
            conn.commit()

    print(
        "Backfilled English translations: "
        f"{len(category_rows)} categories, {len(tag_rows)} tags, {len(publication_rows)} publications"
    )


if __name__ == "__main__":
    main()
