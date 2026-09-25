from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


@dataclass(frozen=True)
class ApiSettings:
    database_url: str
    embedding_model_name: str
    db_pool_minconn: int
    db_pool_maxconn: int
    statement_timeout_ms: int
    default_search_limit: int
    max_search_limit: int
    search_min_similarity: float
    search_strict_min_similarity: float
    default_recommend_limit: int
    max_recommend_limit: int
    als_factors: int
    als_regularization: float
    als_iterations: int
    als_alpha: float
    als_model_path: Path
    als_retrain_interval_seconds: int


def load_api_settings() -> ApiSettings:
    load_dotenv()

    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        raise ValueError("DATABASE_URL is required")

    als_model_path = Path(os.getenv("AI_API_ALS_MODEL_PATH", "./models/als_model.pkl"))

    return ApiSettings(
        database_url=database_url,
        embedding_model_name=os.getenv(
            "AI_ETL_EMBEDDING_MODEL",
            "bkai-foundation-models/vietnamese-bi-encoder",
        ),
        db_pool_minconn=int(os.getenv("AI_API_DB_POOL_MINCONN", "1")),
        db_pool_maxconn=int(os.getenv("AI_API_DB_POOL_MAXCONN", "12")),
        statement_timeout_ms=int(os.getenv("AI_API_DB_STATEMENT_TIMEOUT_MS", "5000")),
        default_search_limit=int(os.getenv("AI_API_DEFAULT_SEARCH_LIMIT", "10")),
        max_search_limit=int(os.getenv("AI_API_MAX_SEARCH_LIMIT", "50")),
        search_min_similarity=float(os.getenv("AI_API_SEARCH_MIN_SIMILARITY", "0.50")),
        search_strict_min_similarity=float(os.getenv("AI_API_SEARCH_STRICT_MIN_SIMILARITY", "0.68")),
        default_recommend_limit=int(os.getenv("AI_API_RECOMMEND_DEFAULT_LIMIT", "10")),
        max_recommend_limit=int(os.getenv("AI_API_RECOMMEND_MAX_LIMIT", "50")),
        als_factors=int(os.getenv("AI_API_ALS_FACTORS", "32")),
        als_regularization=float(os.getenv("AI_API_ALS_REGULARIZATION", "0.05")),
        als_iterations=int(os.getenv("AI_API_ALS_ITERATIONS", "15")),
        als_alpha=float(os.getenv("AI_API_ALS_ALPHA", "40")),
        als_model_path=als_model_path,
        als_retrain_interval_seconds=int(os.getenv("AI_API_ALS_RETRAIN_INTERVAL_SECONDS", "3600")),
    )
