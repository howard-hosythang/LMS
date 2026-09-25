from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv


@dataclass(frozen=True)
class Settings:
    database_url: str
    rabbitmq_url: str
    gemini_api_key: str
    gemini_model_cheap: str
    gemini_model_premium: str
    gemini_min_request_interval_seconds: float
    embedding_model_name: str
    chunk_size: int
    chunk_overlap: int
    vector_insert_batch_size: int
    reduce_max_chunks: int
    reduce_max_chars_per_chunk: int
    reduce_total_chars_budget: int
    enable_hash_skip: bool
    enable_english_translation: bool
    allow_metadata_fallback: bool
    enable_ocr_fallback: bool
    ocr_max_pages: int
    ocr_dpi: int
    ocr_language: str
    ocr_min_text_chars: int
    llm_timeout_seconds: int
    llm_retry_attempts: int
    webhook_timeout_seconds: int
    backend_webhook_secret: str
    worker_db_pool_minconn: int
    worker_db_pool_maxconn: int


def _parse_bool(value: str, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


def load_settings() -> Settings:
    load_dotenv()

    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        raise ValueError("DATABASE_URL is required")

    rabbitmq_url = os.getenv("RABBITMQ_URL", "").strip()
    if not rabbitmq_url:
        raise ValueError("RABBITMQ_URL is required")

    gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not gemini_api_key:
        raise ValueError("GEMINI_API_KEY is required")

    backend_webhook_secret = os.getenv("BACKEND_WEBHOOK_SECRET", "").strip()
    if not backend_webhook_secret:
        raise ValueError("BACKEND_WEBHOOK_SECRET is required")

    chunk_size = int(os.getenv("AI_ETL_CHUNK_SIZE", "1500"))
    chunk_overlap = int(os.getenv("AI_ETL_CHUNK_OVERLAP", "150"))

    if chunk_overlap >= chunk_size:
        raise ValueError("AI_ETL_CHUNK_OVERLAP must be smaller than AI_ETL_CHUNK_SIZE")

    return Settings(
        database_url=database_url,
        rabbitmq_url=rabbitmq_url,
        gemini_api_key=gemini_api_key,
        gemini_model_cheap=os.getenv("AI_ETL_GEMINI_MODEL_CHEAP", "gemini-2.5-flash-lite"),
        gemini_model_premium=os.getenv("AI_ETL_GEMINI_MODEL_PREMIUM", ""),
        gemini_min_request_interval_seconds=float(
            os.getenv("AI_ETL_GEMINI_MIN_REQUEST_INTERVAL_SECONDS", "4.0")
        ),
        embedding_model_name=os.getenv(
            "AI_ETL_EMBEDDING_MODEL",
            "bkai-foundation-models/vietnamese-bi-encoder",
        ),
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        vector_insert_batch_size=int(os.getenv("AI_ETL_VECTOR_INSERT_BATCH_SIZE", "256")),
        reduce_max_chunks=int(os.getenv("AI_ETL_REDUCE_MAX_CHUNKS", "12")),
        reduce_max_chars_per_chunk=int(os.getenv("AI_ETL_REDUCE_MAX_CHARS_PER_CHUNK", "900")),
        reduce_total_chars_budget=int(os.getenv("AI_ETL_REDUCE_TOTAL_CHARS_BUDGET", "10000")),
        enable_hash_skip=_parse_bool(os.getenv("AI_ETL_ENABLE_HASH_SKIP", "true"), True),
        enable_english_translation=_parse_bool(
            os.getenv("AI_ETL_ENABLE_ENGLISH_TRANSLATION", "false"),
            False,
        ),
        allow_metadata_fallback=_parse_bool(
            os.getenv("AI_ETL_ALLOW_METADATA_FALLBACK", "false"),
            False,
        ),
        enable_ocr_fallback=_parse_bool(os.getenv("AI_ETL_ENABLE_OCR_FALLBACK", "true"), True),
        ocr_max_pages=max(0, int(os.getenv("AI_ETL_OCR_MAX_PAGES", "32"))),
        ocr_dpi=max(72, int(os.getenv("AI_ETL_OCR_DPI", "160"))),
        ocr_language=os.getenv("AI_ETL_OCR_LANGUAGE", "eng+vie").strip() or "eng",
        ocr_min_text_chars=max(0, int(os.getenv("AI_ETL_OCR_MIN_TEXT_CHARS", "500"))),
        llm_timeout_seconds=int(os.getenv("AI_ETL_LLM_TIMEOUT_SECONDS", "30")),
        llm_retry_attempts=int(os.getenv("AI_ETL_LLM_RETRY_ATTEMPTS", "2")),
        webhook_timeout_seconds=int(os.getenv("AI_ETL_WEBHOOK_TIMEOUT_SECONDS", "8")),
        backend_webhook_secret=backend_webhook_secret,
        worker_db_pool_minconn=int(os.getenv("AI_ETL_DB_POOL_MINCONN", "1")),
        worker_db_pool_maxconn=int(os.getenv("AI_ETL_DB_POOL_MAXCONN", "6")),
    )
