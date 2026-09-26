#!/usr/bin/env sh
set -eu

root_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
backup_dir="$root_dir/backups"

umask 077
mkdir -p "$backup_dir"

cd "$root_dir"
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile backup run --rm postgres-backup
find "$backup_dir" -maxdepth 1 -type f -name 'library-*.dump' -mtime +14 -delete
