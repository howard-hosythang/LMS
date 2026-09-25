#!/usr/bin/env sh
set -eu

python scripts/wait_for_tcp.py --host "${DB_HOST:-host.docker.internal}" --port "${DB_PORT:-5432}" --timeout 120

if [ "${RUN_AI_SCHEMA_MIGRATION:-1}" = "1" ]; then
  echo "Applying AI schema migration..."
  psql "${DATABASE_URL:?DATABASE_URL is required}" -v ON_ERROR_STOP=1 -f /app/init_schema.sql
  echo "AI schema migration completed."
fi

exec "$@"
