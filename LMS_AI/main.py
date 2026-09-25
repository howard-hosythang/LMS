from __future__ import annotations

import argparse
import json
from pathlib import Path

from ai_etl.config import load_settings
from ai_etl.db import Database
from ai_etl.embedding_client import EmbeddingClient
from ai_etl.llm_client import GeminiClient
from ai_etl.pipeline import AIEtlPipeline


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run AI ETL pipeline for one publication PDF")
    parser.add_argument("--publication-id", type=int, required=True, help="ID in public.publications")
    parser.add_argument("--pdf-path", type=Path, required=False, help="Absolute or relative PDF path (optional, will fetch from DB if not provided)")
    return parser


def get_pdf_url_from_db(database: "Database", publication_id: int) -> str:
    """Fetch PDF URL from public.publications table."""
    with database.connect() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT file_url FROM public.publications WHERE id = %s", (publication_id,))
            result = cur.fetchone()
            if not result or not result[0]:
                raise ValueError(f"No PDF URL found for publication ID {publication_id}")
            return result[0]


def main() -> None:
    parser = build_arg_parser()
    args = parser.parse_args()

    settings = load_settings()

    database = Database(settings.database_url)

    # Determine PDF source
    if args.pdf_path:
        # Use provided local path
        if not args.pdf_path.exists() or not args.pdf_path.is_file():
            raise FileNotFoundError(f"PDF not found: {args.pdf_path}")
        pdf_source = args.pdf_path
    else:
        # Fetch PDF URL from database
        pdf_source = get_pdf_url_from_db(database, args.publication_id)

    llm_client = GeminiClient(
        api_key=settings.gemini_api_key,
        cheap_model=settings.gemini_model_cheap,
        premium_model=settings.gemini_model_premium,
        timeout_seconds=settings.llm_timeout_seconds,
        retry_attempts=settings.llm_retry_attempts,
    )
    embedding_client = EmbeddingClient(settings.embedding_model_name)

    pipeline = AIEtlPipeline(settings, database, llm_client, embedding_client)
    result = pipeline.run(publication_id=args.publication_id, pdf_path=pdf_source)

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
