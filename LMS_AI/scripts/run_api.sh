#!/usr/bin/env sh
set -eu

python scripts/wait_for_tcp.py --host "$DB_HOST" --port "$DB_PORT" --timeout 120
python scripts/wait_for_tcp.py --host "$RABBITMQ_HOST" --port "$RABBITMQ_PORT" --timeout 120

exec python -m uvicorn api_service:app --host 0.0.0.0 --port "${FASTAPI_PORT:-8001}" --workers 1
