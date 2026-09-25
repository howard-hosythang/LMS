from __future__ import annotations

import argparse
import json
import os

from dotenv import load_dotenv
from worker import celery_app


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Push a mock book-processing message to RabbitMQ via Celery")
    parser.add_argument("--book-id", type=int, required=True)
    parser.add_argument("--pdf-url", type=str, required=True)
    parser.add_argument("--webhook-url", type=str, default=None)
    return parser


def main() -> None:
    load_dotenv()
    args = build_parser().parse_args()

    webhook_url = args.webhook_url or os.getenv("BACKEND_WEBHOOK_URL", "").strip()
    if not webhook_url:
        raise ValueError("webhook_url is required (CLI --webhook-url or BACKEND_WEBHOOK_URL in .env)")

    payload = {
        "book_id": args.book_id,
        "pdf_url": args.pdf_url,
        "webhook_url": webhook_url,
    }

    task = celery_app.send_task(
        "worker.process_book_message",
        kwargs={"payload": payload},
        queue="book.processing.queue",
    )

    print(json.dumps({"task_id": task.id, "payload": payload}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
