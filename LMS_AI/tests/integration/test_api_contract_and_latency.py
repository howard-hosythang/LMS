from __future__ import annotations

import os
import time

import pytest
import requests

API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8001")
API_LATENCY_THRESHOLD_MS = float(os.getenv("API_LATENCY_THRESHOLD_MS", "200"))
RUN_LIVE_AI_CONTRACT_TESTS = os.getenv("RUN_LIVE_AI_CONTRACT_TESTS", "0") == "1"


def _require_live_ai_service() -> None:
    if not RUN_LIVE_AI_CONTRACT_TESTS:
        pytest.skip("Set RUN_LIVE_AI_CONTRACT_TESTS=1 to run live FastAPI contract tests")

    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=3)
    except requests.RequestException as exc:
        pytest.skip(f"AI service is not reachable at {API_BASE_URL}: {exc}")

    if response.status_code != 200:
        pytest.skip(f"AI service health check failed: {response.status_code} {response.text}")


def _post(path: str, payload: dict):
    started = time.perf_counter()
    response = requests.post(f"{API_BASE_URL}{path}", json=payload, timeout=10)
    elapsed_ms = (time.perf_counter() - started) * 1000
    return response, elapsed_ms


def test_health_contract():
    _require_live_ai_service()

    response = requests.get(f"{API_BASE_URL}/health", timeout=3)

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "ok"


def test_semantic_search_contract_and_latency():
    _require_live_ai_service()

    response, elapsed_ms = _post(
        "/api/v1/semantic-search",
        {
            "query_text": "Trí tuệ nhân tạo và học máy ứng dụng",
            "limit": 5,
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert "publication_ids" in body
    assert isinstance(body["publication_ids"], list)
    assert elapsed_ms < API_LATENCY_THRESHOLD_MS, f"Latency too high: {elapsed_ms:.2f}ms"


def test_recommendation_contract_and_latency():
    _require_live_ai_service()

    response, elapsed_ms = _post(
        "/api/v1/recommendations",
        {
            "user_id": int(os.getenv("TEST_USER_ID", "1")),
            "limit": 5,
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert "publication_ids" in body
    assert "strategy" in body
    assert isinstance(body["publication_ids"], list)
    assert isinstance(body["strategy"], str)
    assert elapsed_ms < API_LATENCY_THRESHOLD_MS, f"Latency too high: {elapsed_ms:.2f}ms"
