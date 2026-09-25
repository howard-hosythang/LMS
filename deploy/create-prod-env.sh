#!/usr/bin/env sh
set -eu

root_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
output_file="$root_dir/.env.prod"
tmp_file=$(mktemp "$root_dir/.env.prod.XXXXXX")
trap 'rm -f "$tmp_file"' EXIT

value_from() {
  awk -F= -v key="$2" '$1 == key { sub(/^[^=]*=/, ""); print; exit }' "$1"
}

require_value() {
  value=$(value_from "$1" "$2")
  if [ -z "$value" ]; then
    printf 'Missing %s in %s\n' "$2" "$1" >&2
    exit 1
  fi
  printf '%s' "$value"
}

append_key() {
  printf '%s=%s\n' "$1" "$2" >> "$tmp_file"
}

be_env="$root_dir/LMS_BE/.env"
ai_env="$root_dir/LMS_AI/.env"
fe_env="$root_dir/LMS_FE/.env"
for env_file in "$be_env" "$ai_env" "$fe_env"; do
  [ -f "$env_file" ] || { printf 'Missing %s\n' "$env_file" >&2; exit 1; }
done

umask 077
db_password=$(openssl rand -hex 32)
callback_secret=$(openssl rand -hex 32)

append_key PUBLIC_DOMAIN library74.uk
append_key ACME_EMAIL "$(require_value "$be_env" MAIL_SENDER_USERNAME)"
append_key POSTGRES_DB library
append_key POSTGRES_USER library
append_key POSTGRES_PASSWORD "$db_password"
append_key BE_DATABASE_URL jdbc:postgresql://postgres:5432/library
append_key AI_DATABASE_URL "postgresql://library:${db_password}@postgres:5432/library"
append_key SERVICE_CALLBACK_SECRET "$callback_secret"

for key in GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GOOGLE_BOOKS_API_KEY MAIL_HOST MAIL_SENDER_USERNAME MAIL_SENDER_PASSWORD MAIL_NOREPLY_ADDRESS MAIL_SUPPORT_ADDRESS AWS_REGION AWS_S3_BUCKET AWS_ACCESS_KEY AWS_SECRET_KEY EXP_TOKEN EXP_REFRESH_TOKEN PAYOS_BASE_URL CLIENT_ID_PAYOS API_KEY_PAYOS CHECKSUM_KEY_PAYOS; do
  append_key "$key" "$(value_from "$be_env" "$key")"
done

for key in GEMINI_API_KEY AI_ETL_GEMINI_MODEL_CHEAP AI_ETL_GEMINI_MODEL_PREMIUM AI_ETL_EMBEDDING_MODEL AI_ETL_CHUNK_SIZE AI_ETL_CHUNK_OVERLAP AI_ETL_VECTOR_INSERT_BATCH_SIZE AI_ETL_GEMINI_MIN_REQUEST_INTERVAL_SECONDS AI_ETL_REDUCE_MAX_CHUNKS AI_ETL_REDUCE_MAX_CHARS_PER_CHUNK AI_ETL_REDUCE_TOTAL_CHARS_BUDGET AI_ETL_ENABLE_HASH_SKIP AI_ETL_ALLOW_METADATA_FALLBACK AI_ETL_ENABLE_OCR_FALLBACK AI_ETL_OCR_MAX_PAGES AI_ETL_OCR_DPI AI_ETL_OCR_LANGUAGE AI_ETL_OCR_MIN_TEXT_CHARS AI_ETL_LLM_TIMEOUT_SECONDS AI_ETL_LLM_RETRY_ATTEMPTS AI_ETL_WORKER_CONCURRENCY AI_ETL_WEBHOOK_TIMEOUT_SECONDS AI_ETL_DB_POOL_MINCONN AI_ETL_DB_POOL_MAXCONN AI_API_DB_POOL_MINCONN AI_API_DB_POOL_MAXCONN AI_API_DB_STATEMENT_TIMEOUT_MS AI_API_DEFAULT_SEARCH_LIMIT AI_API_MAX_SEARCH_LIMIT AI_API_SEARCH_MIN_SIMILARITY AI_API_SEARCH_STRICT_MIN_SIMILARITY AI_API_RECOMMEND_DEFAULT_LIMIT AI_API_RECOMMEND_MAX_LIMIT AI_API_ALS_FACTORS AI_API_ALS_REGULARIZATION AI_API_ALS_ITERATIONS AI_API_ALS_ALPHA AI_API_ALS_MODEL_PATH AI_API_ALS_RETRAIN_INTERVAL_SECONDS; do
  append_key "$key" "$(value_from "$ai_env" "$key")"
done

append_key VITE_API_TIMEOUT "$(value_from "$fe_env" VITE_API_TIMEOUT)"
append_key VITE_GA_MEASUREMENT_ID "$(value_from "$fe_env" VITE_GA_MEASUREMENT_ID)"
append_key GRAFANA_ADMIN_USER admin
append_key GRAFANA_ADMIN_PASSWORD "$(openssl rand -hex 24)"
append_key GRAFANA_ROOT_URL http://localhost:3001
append_key TELEGRAM_BOT_TOKEN "$(value_from "$be_env" TELEGRAM_BOT_TOKEN)"
append_key TELEGRAM_CHAT_ID "$(value_from "$be_env" TELEGRAM_CHAT_ID)"

mv "$tmp_file" "$output_file"
trap - EXIT
printf 'Created %s with permissions 600.\n' "$output_file"
