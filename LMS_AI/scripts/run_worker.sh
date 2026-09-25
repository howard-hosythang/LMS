#!/usr/bin/env sh
set -eu

python scripts/wait_for_tcp.py --host "$DB_HOST" --port "$DB_PORT" --timeout 120
python scripts/wait_for_tcp.py --host "$RABBITMQ_HOST" --port "$RABBITMQ_PORT" --timeout 120

exec celery -A worker.celery_app worker \
  --loglevel=INFO \
  --queues book.processing.queue \
  --concurrency="${AI_ETL_WORKER_CONCURRENCY:-1}"
