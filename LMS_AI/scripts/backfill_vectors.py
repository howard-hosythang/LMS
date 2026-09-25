#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import time
from pathlib import Path
from typing import Iterable

import psycopg2
from dotenv import load_dotenv

from ai_etl.config import load_settings
from ai_etl.db import Database
from ai_etl.embedding_client import EmbeddingClient
from ai_etl.pdf_processing import extract_pdf_text, sliding_window_chunk


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Backfill embeddings for publications that already have file_url"
    )
    parser.add_argument("--batch-size", type=int, default=2, help="How many publications to process per batch")
    parser.add_argument("--sleep-seconds", type=float, default=2.0, help="Pause between publications")
    parser.add_argument("--limit", type=int, default=0, help="Optional maximum number of publications to process")
    parser.add_argument("--only-missing-vectors", action="store_true", help="Skip publications that already have vectors")
    return parser


def _iter_batches(items: list[tuple[int, str]], batch_size: int) -> Iterable[list[tuple[int, str]]]:
    for index in range(0, len(items), batch_size):
        yield items[index : index + batch_size]


def main() -> None:
    load_dotenv()
    args = build_parser().parse_args()
    settings = load_settings()

    database = Database(settings.database_url)
    embedding_client = EmbeddingClient(settings.embedding_model_name)

    with psycopg2.connect(settings.database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, file_url
                FROM public.publications
                WHERE file_url IS NOT NULL
                  AND length(btrim(file_url)) > 0
                ORDER BY id
                """
            )
            rows = [(int(row[0]), str(row[1])) for row in cur.fetchall()]

    if args.only_missing_vectors:
        with psycopg2.connect(settings.database_url) as conn:
            with conn.cursor() as cur:
                filtered: list[tuple[int, str]] = []
                for publication_id, file_url in rows:
                    cur.execute(
                        "SELECT COUNT(*) FROM ai_engine.publication_vectors WHERE publication_id = %s",
                        (publication_id,),
                    )
                    vector_count = int(cur.fetchone()[0])
                    if vector_count == 0:
                        filtered.append((publication_id, file_url))
                rows = filtered

    if args.limit > 0:
        rows = rows[: args.limit]

    if not rows:
        print(json.dumps({"status": "EMPTY", "processed": 0}, ensure_ascii=False, indent=2))
        return

    processed = 0
    successes = 0
    failures: list[dict[str, object]] = []

    for batch_index, batch in enumerate(_iter_batches(rows, args.batch_size), start=1):
        print(f"Processing batch {batch_index} with {len(batch)} publication(s)")
        for publication_id, file_url in batch:
            processed += 1
            try:
                pdf_source = Path(file_url) if not file_url.startswith(("http://", "https://")) else file_url
                full_text = extract_pdf_text(
                    pdf_source,
                    enable_ocr_fallback=settings.enable_ocr_fallback,
                    ocr_max_pages=settings.ocr_max_pages,
                    ocr_dpi=settings.ocr_dpi,
                    ocr_language=settings.ocr_language,
                    ocr_min_text_chars=settings.ocr_min_text_chars,
                )
                chunks = sliding_window_chunk(
                    text=full_text,
                    chunk_size=settings.chunk_size,
                    overlap=settings.chunk_overlap,
                )
                if not chunks:
                    raise ValueError("No valid text chunks extracted from PDF")

                chunk_texts = [chunk.text for chunk in chunks]
                vectors = embedding_client.encode(chunk_texts)

                with database.connect() as conn:
                    database.ensure_etl_metadata_table(conn)
                    database.clear_previous_ai_data(conn, publication_id)
                    conn.commit()
                    vector_rows = list(zip(chunk_texts, vectors))
                    for start in range(0, len(vector_rows), settings.vector_insert_batch_size):
                        batch_rows = vector_rows[start : start + settings.vector_insert_batch_size]
                        database.bulk_insert_vectors(conn, publication_id, batch_rows)
                    database.upsert_publication_file_hash(
                        conn,
                        publication_id,
                        "vector-only-backfill",
                        chunks_count=len(chunks),
                        vectors_count=len(vectors),
                    )
                    conn.commit()

                successes += 1
                print(json.dumps({
                    "publication_id": publication_id,
                    "status": "OK",
                    "chunks": len(chunks),
                    "vectors": len(vectors),
                }, ensure_ascii=False))

            except Exception as exc:
                failures.append({"publication_id": publication_id, "error": str(exc)})
                print(json.dumps({
                    "publication_id": publication_id,
                    "status": "FAILED",
                    "error": str(exc),
                }, ensure_ascii=False))

            time.sleep(max(0.0, args.sleep_seconds))

    summary = {
        "status": "DONE",
        "processed": processed,
        "successes": successes,
        "failures": failures,
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
