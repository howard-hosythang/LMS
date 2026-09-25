#!/usr/bin/env python3
from __future__ import annotations

import argparse
import time

import requests


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Force reprocess AI metadata through the FastAPI AI service")
    parser.add_argument("--api-base-url", default="http://127.0.0.1:8001")
    parser.add_argument("--publication-id", type=int, action="append", dest="publication_ids")
    parser.add_argument("--from-audit-file", help="Read publication ids from audit_ai_metadata.py output")
    parser.add_argument("--sleep-seconds", type=float, default=1.0)
    return parser.parse_args()


def ids_from_audit_file(path: str) -> list[int]:
    ids: list[int] = []
    with open(path, "r", encoding="utf-8") as file_obj:
        for line in file_obj:
            line = line.strip()
            if not line.startswith("- #"):
                continue
            token = line.split(maxsplit=2)[1]
            try:
                ids.append(int(token.lstrip("#")))
            except ValueError:
                continue
    return ids


def main() -> None:
    args = parse_args()
    publication_ids = list(args.publication_ids or [])
    if args.from_audit_file:
        publication_ids.extend(ids_from_audit_file(args.from_audit_file))

    publication_ids = list(dict.fromkeys(publication_ids))
    if not publication_ids:
        raise SystemExit("No publication ids supplied")

    for publication_id in publication_ids:
        response = requests.post(
            f"{args.api_base_url.rstrip('/')}/api/v1/publications/process",
            json={"publication_id": publication_id, "force_reprocess": True},
            timeout=240,
        )
        if response.status_code >= 400:
            print(f"FAILED #{publication_id}: {response.status_code} {response.text}")
        else:
            print(f"OK #{publication_id}: {response.json()}")
        time.sleep(args.sleep_seconds)


if __name__ == "__main__":
    main()
