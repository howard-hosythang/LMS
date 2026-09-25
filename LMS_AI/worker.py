from __future__ import annotations

import shutil
import tempfile
import hmac
import hashlib
import json
import time
from pathlib import Path
from typing import Any

import requests
from ai_etl.config import Settings, load_settings
from ai_etl.db import Database, DatabaseConnectionPool
from ai_etl.embedding_client import EmbeddingClient
from ai_etl.llm_client import GeminiClient, LLMResponseError
from ai_etl.pipeline import AIEtlPipeline
from celery import Celery
from celery.signals import worker_process_init, worker_process_shutdown
from requests import RequestException

SETTINGS: Settings | None = None
DB_POOL: DatabaseConnectionPool | None = None
PIPELINE: AIEtlPipeline | None = None


class TransientWorkerError(RuntimeError):
    pass


def _ensure_runtime_ready() -> tuple[Settings, DatabaseConnectionPool, AIEtlPipeline]:
    if SETTINGS is None or DB_POOL is None or PIPELINE is None:
        raise RuntimeError("Worker runtime is not initialized")
    return SETTINGS, DB_POOL, PIPELINE


def _build_celery_app() -> Celery:
    settings = load_settings()
    app = Celery("lms_ai_worker", broker=settings.rabbitmq_url)
    app.conf.update(
        task_default_queue="book.processing.queue",
        task_routes={"worker.process_book_message": {"queue": "book.processing.queue"}},
        task_acks_late=True,
        worker_prefetch_multiplier=1,
        worker_max_tasks_per_child=50,
        task_serializer="json",
        accept_content=["json"],
        result_backend=None,
    )
    return app


celery_app = _build_celery_app()


@worker_process_init.connect
def on_worker_process_init(**_: Any) -> None:
    global SETTINGS, DB_POOL, PIPELINE

    SETTINGS = load_settings()
    DB_POOL = DatabaseConnectionPool(
        database_url=SETTINGS.database_url,
        minconn=SETTINGS.worker_db_pool_minconn,
        maxconn=SETTINGS.worker_db_pool_maxconn,
    )

    database = Database(SETTINGS.database_url)
    llm_client = GeminiClient(
        api_key=SETTINGS.gemini_api_key,
        cheap_model=SETTINGS.gemini_model_cheap,
        premium_model=SETTINGS.gemini_model_premium,
        timeout_seconds=SETTINGS.llm_timeout_seconds,
        retry_attempts=SETTINGS.llm_retry_attempts,
        min_request_interval_seconds=SETTINGS.gemini_min_request_interval_seconds,
    )
    embedding_client = EmbeddingClient(SETTINGS.embedding_model_name)
    PIPELINE = AIEtlPipeline(
        settings=SETTINGS,
        database=database,
        llm_client=llm_client,
        embedding_client=embedding_client,
    )


@worker_process_shutdown.connect
def on_worker_process_shutdown(**_: Any) -> None:
    global DB_POOL
    if DB_POOL is not None:
        DB_POOL.close()
        DB_POOL = None


def _validate_payload(payload: dict[str, Any]) -> tuple[int, str, str]:
    required = ("book_id", "pdf_url", "webhook_url")
    missing = [key for key in required if key not in payload or payload.get(key) in (None, "")]
    if missing:
        raise ValueError(f"Message is missing required fields: {', '.join(missing)}")

    book_id = int(payload["book_id"])
    pdf_url = str(payload["pdf_url"])
    webhook_url = str(payload["webhook_url"])
    return book_id, pdf_url, webhook_url


def _download_pdf_to_temp(pdf_url: str) -> tuple[Path, Path]:
    temp_dir = Path(tempfile.mkdtemp(prefix="lms-ai-worker-"))
    pdf_path = temp_dir / "source.pdf"

    try:
        with requests.get(pdf_url, stream=True, timeout=30) as response:
            response.raise_for_status()
            with pdf_path.open("wb") as file_obj:
                for chunk in response.iter_content(chunk_size=1024 * 64):
                    if chunk:
                        file_obj.write(chunk)
    except RequestException as exc:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise TransientWorkerError(f"Failed to download PDF from {pdf_url}: {exc}") from exc

    if not pdf_path.exists() or pdf_path.stat().st_size == 0:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise ValueError("Downloaded PDF is empty")

    return temp_dir, pdf_path


def _build_webhook_headers(payload_body: str, secret: str) -> dict[str, str]:
    timestamp = str(int(time.time()))
    signed_payload = f"{timestamp}.{payload_body}".encode("utf-8")
    signature = hmac.new(secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
    return {
        "Content-Type": "application/json",
        "X-AI-Callback-Timestamp": timestamp,
        "X-AI-Callback-Signature": f"sha256={signature}",
    }


def _post_webhook(webhook_url: str, payload: dict[str, Any], timeout_seconds: int, secret: str) -> None:
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    headers = _build_webhook_headers(body, secret)
    try:
        response = requests.post(webhook_url, data=body.encode("utf-8"), headers=headers, timeout=timeout_seconds)
        response.raise_for_status()
    except RequestException as exc:
        raise TransientWorkerError(f"Webhook callback failed: {exc}") from exc


def _cleanup_temp_dir(temp_dir: Path | None) -> None:
    if temp_dir is None:
        return
    shutil.rmtree(temp_dir, ignore_errors=True)


@celery_app.task(bind=True, name="worker.process_book_message", max_retries=3)
def process_book_message(self, payload: dict[str, Any]) -> dict[str, Any]:
    settings, db_pool, pipeline = _ensure_runtime_ready()

    temp_dir: Path | None = None
    pdf_path: Path | None = None
    book_id = -1
    webhook_url = ""

    try:
        book_id, pdf_url, webhook_url = _validate_payload(payload)
        temp_dir, pdf_path = _download_pdf_to_temp(pdf_url)

        with db_pool.connection() as conn:
            result = pipeline.run(publication_id=book_id, pdf_path=pdf_path, conn=conn)

        success_payload = {
            "book_id": book_id,
            "status": "SUCCESS",
        }
        _post_webhook(
            webhook_url,
            success_payload,
            settings.webhook_timeout_seconds,
            settings.backend_webhook_secret,
        )
        return result

    except Exception as exc:
        if book_id > 0:
            try:
                file_hash = AIEtlPipeline._calculate_file_hash(pdf_path if pdf_path is not None else payload.get("pdf_url", ""))
                with db_pool.connection() as conn:
                    pipeline.database.ensure_etl_metadata_table(conn)
                    pipeline.database.mark_publication_etl_failed(conn, book_id, file_hash, str(exc))
                    conn.commit()
            except Exception:
                pass

        error_payload = {
            "book_id": book_id,
            "status": "FAILED",
            "error": str(exc),
        }
        if webhook_url:
            try:
                _post_webhook(
                    webhook_url,
                    error_payload,
                    settings.webhook_timeout_seconds,
                    settings.backend_webhook_secret,
                )
            except Exception:
                # Keep original exception context for retry/raise below.
                pass

        is_transient = isinstance(exc, (TransientWorkerError, RequestException, LLMResponseError))
        if is_transient and self.request.retries < self.max_retries:
            countdown_seconds = 120 * (self.request.retries + 1)
            raise self.retry(exc=exc, countdown=countdown_seconds)

        raise

    finally:
        _cleanup_temp_dir(temp_dir)
