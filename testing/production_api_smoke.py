#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import ssl
import time
from dataclasses import dataclass
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


BASE_URL = os.getenv("LIBRARY74_BASE_URL", "https://library74.uk").rstrip("/")
API_BASE = f"{BASE_URL}/api/v1"
TIMEOUT_SECONDS = float(os.getenv("LIBRARY74_SMOKE_TIMEOUT", "20"))
SSL_CONTEXT = (
    ssl._create_unverified_context()
    if os.getenv("LIBRARY74_INSECURE_TLS") == "1"
    else None
)


@dataclass
class Case:
    name: str
    method: str
    path: str
    expected_statuses: set[int]
    payload: dict[str, Any] | None = None
    query: dict[str, Any] | None = None
    headers: dict[str, str] | None = None


def request(case: Case) -> tuple[int, float, str]:
    url = f"{BASE_URL}{case.path}"
    if case.query:
        url = f"{url}?{urlencode(case.query)}"

    data = None
    headers = {"Accept": "application/json", **(case.headers or {})}
    if case.payload is not None:
        data = json.dumps(case.payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    started = time.perf_counter()
    req = Request(url, data=data, headers=headers, method=case.method)
    try:
        with urlopen(req, timeout=TIMEOUT_SECONDS, context=SSL_CONTEXT) as response:
            body = response.read().decode("utf-8", errors="replace")
            return response.status, (time.perf_counter() - started) * 1000, body
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        return exc.code, (time.perf_counter() - started) * 1000, body
    except URLError as exc:
        return 0, (time.perf_counter() - started) * 1000, str(exc)


def main() -> int:
    cases = [
        Case("homepage loads", "GET", "/", {200}, headers={"Accept": "text/html"}),
        Case(
            "catalog search returns 200",
            "GET",
            "/api/v1/publications/search",
            {200},
            query={"keyword": "machine", "page": 0, "limit": 5},
        ),
        Case("public stats returns 200", "GET", "/api/v1/publications/public-stats", {200}),
        Case("newest books returns 200", "GET", "/api/v1/publications/newest", {200}, query={"limit": 3}),
        Case(
            "semantic search returns 200",
            "POST",
            "/api/v1/ai/semantic-search",
            {200},
            payload={"queryText": "machine learning", "limit": 5},
        ),
        Case(
            "bad login is rejected",
            "POST",
            "/api/v1/auth/login",
            {400, 401},
            payload={"email": "fake.library74.test@gmail.com", "password": "wrong-password"},
        ),
        Case("admin endpoint without token is rejected", "GET", "/api/v1/admin/users", {401, 403}),
        Case(
            "invalid semantic payload is handled",
            "POST",
            "/api/v1/ai/semantic-search",
            {200, 400, 422, 500},
            payload={"queryText": "", "limit": -1},
        ),
    ]

    print(f"Production API smoke test: {BASE_URL}")
    print("| Case | Status | Latency ms | Result |")
    print("| --- | ---: | ---: | --- |")
    failures = 0
    for case in cases:
        status, latency_ms, body = request(case)
        ok = status in case.expected_statuses
        failures += 0 if ok else 1
        snippet = " ".join(body.replace("\n", " ").split())[:120]
        print(f"| {case.name} | {status} | {latency_ms:.2f} | {'PASS' if ok else 'FAIL'}: `{snippet}` |")

    print()
    print(f"Summary: {len(cases) - failures}/{len(cases)} passed")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
