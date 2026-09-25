from __future__ import annotations

import hashlib
import hmac
import os
import sys
import types
from pathlib import Path

import pytest

os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost:5432/lms")
os.environ.setdefault("RABBITMQ_URL", "amqp://guest:guest@localhost:5672//")
os.environ.setdefault("GEMINI_API_KEY", "test-gemini-key")
os.environ.setdefault("BACKEND_WEBHOOK_SECRET", "test-secret")

if "celery" not in sys.modules:
    class _FakeCelery:
        def __init__(self, *args, **kwargs) -> None:
            self.conf = types.SimpleNamespace(update=lambda **_kwargs: None)

        def task(self, *args, **kwargs):
            def decorator(func):
                return func

            return decorator

    class _FakeSignal:
        def connect(self, func=None, **_kwargs):
            if func is None:
                return lambda wrapped: wrapped
            return func

    celery_module = types.ModuleType("celery")
    celery_module.Celery = _FakeCelery
    signals_module = types.ModuleType("celery.signals")
    signals_module.worker_process_init = _FakeSignal()
    signals_module.worker_process_shutdown = _FakeSignal()
    sys.modules["celery"] = celery_module
    sys.modules["celery.signals"] = signals_module

import worker  # noqa: E402


class FakeDownloadResponse:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def raise_for_status(self) -> None:
        pass

    def iter_content(self, chunk_size: int):
        yield b"%PDF-1.7"
        yield b"content"


class FakePostResponse:
    def __init__(self, status_error: Exception | None = None) -> None:
        self.status_error = status_error

    def raise_for_status(self) -> None:
        if self.status_error:
            raise self.status_error


def test_validate_payload_requires_book_pdf_and_webhook() -> None:
    assert worker._validate_payload({
        "book_id": "12",
        "pdf_url": "https://example.test/book.pdf",
        "webhook_url": "https://backend.test/callback",
    }) == (12, "https://example.test/book.pdf", "https://backend.test/callback")

    with pytest.raises(ValueError, match="pdf_url"):
        worker._validate_payload({"book_id": 12, "webhook_url": "https://backend.test/callback"})


def test_build_webhook_headers_signs_timestamp_dot_body(monkeypatch) -> None:
    monkeypatch.setattr(worker.time, "time", lambda: 1_700_000_000)

    headers = worker._build_webhook_headers('{"book_id":12,"status":"SUCCESS"}', "secret")

    expected_signature = hmac.new(
        b"secret",
        b'1700000000.{"book_id":12,"status":"SUCCESS"}',
        hashlib.sha256,
    ).hexdigest()
    assert headers["X-AI-Callback-Timestamp"] == "1700000000"
    assert headers["X-AI-Callback-Signature"] == f"sha256={expected_signature}"
    assert headers["Content-Type"] == "application/json"


def test_post_webhook_sends_compact_json_bytes_with_signature(monkeypatch) -> None:
    captured = {}

    def fake_post(url, data, headers, timeout):
        captured.update(url=url, data=data, headers=headers, timeout=timeout)
        return FakePostResponse()

    monkeypatch.setattr(worker.requests, "post", fake_post)
    monkeypatch.setattr(worker.time, "time", lambda: 1_700_000_000)

    worker._post_webhook(
        "https://backend.test/callback",
        {"book_id": 12, "status": "SUCCESS"},
        timeout_seconds=5,
        secret="secret",
    )

    assert captured["url"] == "https://backend.test/callback"
    assert captured["data"] == b'{"book_id":12,"status":"SUCCESS"}'
    assert captured["timeout"] == 5
    assert captured["headers"]["X-AI-Callback-Signature"].startswith("sha256=")


def test_download_pdf_to_temp_streams_file_and_cleanup(monkeypatch) -> None:
    monkeypatch.setattr(worker.requests, "get", lambda url, stream, timeout: FakeDownloadResponse())

    temp_dir, pdf_path = worker._download_pdf_to_temp("https://example.test/book.pdf")
    try:
        assert pdf_path.exists()
        assert pdf_path.read_bytes() == b"%PDF-1.7content"
    finally:
        worker._cleanup_temp_dir(temp_dir)

    assert not Path(temp_dir).exists()
