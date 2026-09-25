from __future__ import annotations

import ai_etl.config as config_module


def test_metadata_fallback_is_disabled_by_default(monkeypatch, tmp_path) -> None:
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(config_module, "load_dotenv", lambda: None)
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/lms")
    monkeypatch.setenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672//")
    monkeypatch.setenv("GEMINI_API_KEY", "test-gemini-key")
    monkeypatch.setenv("BACKEND_WEBHOOK_SECRET", "test-secret")
    monkeypatch.delenv("AI_ETL_ALLOW_METADATA_FALLBACK", raising=False)

    assert config_module.load_settings().allow_metadata_fallback is False


def test_metadata_fallback_can_be_disabled_explicitly(monkeypatch) -> None:
    monkeypatch.setattr(config_module, "load_dotenv", lambda: None)
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/lms")
    monkeypatch.setenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672//")
    monkeypatch.setenv("GEMINI_API_KEY", "test-gemini-key")
    monkeypatch.setenv("BACKEND_WEBHOOK_SECRET", "test-secret")
    monkeypatch.setenv("AI_ETL_ALLOW_METADATA_FALLBACK", "false")

    assert config_module.load_settings().allow_metadata_fallback is False
