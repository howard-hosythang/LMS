from __future__ import annotations

import argparse
import json

import psycopg2
from ai_etl.config import load_settings
from dotenv import load_dotenv


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Verify vectors/tags/summary written after ETL task")
    parser.add_argument("--book-id", type=int, required=True)
    return parser


def main() -> None:
    load_dotenv()
    args = build_parser().parse_args()
    settings = load_settings()

    with psycopg2.connect(settings.database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM ai_engine.publication_vectors WHERE publication_id = %s",
                (args.book_id,),
            )
            vector_row = cur.fetchone()
            vector_count = int(vector_row[0]) if vector_row else 0

            cur.execute(
                "SELECT COUNT(*) FROM public.publication_tags WHERE publication_id = %s",
                (args.book_id,),
            )
            tag_row = cur.fetchone()
            tag_link_count = int(tag_row[0]) if tag_row else 0

            cur.execute(
                """
                SELECT ai_summary, ai_target_audience
                FROM public.publications
                WHERE id = %s
                """,
                (args.book_id,),
            )
            pub_row = cur.fetchone()

    output = {
        "book_id": args.book_id,
        "vector_count": vector_count,
        "tag_link_count": tag_link_count,
        "has_summary": bool(pub_row and pub_row[0]),
        "has_audience": bool(pub_row and pub_row[1]),
        "status": "OK" if vector_count > 0 and tag_link_count == 5 and pub_row else "NOT_READY",
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
