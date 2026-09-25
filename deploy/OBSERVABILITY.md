# Library74 Observability Runbook

This stack adds production-safe internal observability for Library74:

- Prometheus: metrics collection and alert rule evaluation.
- Alertmanager: alert state and notification routing.
- Grafana: dashboards for metrics and logs.
- cAdvisor: container CPU/RAM/filesystem metrics.
- node-exporter: VPS host disk/CPU/memory metrics.
- Loki: log storage.
- Promtail: Docker container log shipping to Loki.

All observability ports are bound to `127.0.0.1` on the VPS. They are not public through Caddy.

## Start On Production

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile observability up -d --build
```

Required `.env.prod` values:

```env
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=<strong-password>
GRAFANA_ROOT_URL=http://localhost:3001
TELEGRAM_BOT_TOKEN=<telegram-bot-token>
TELEGRAM_CHAT_ID=<telegram-chat-id>
```

## Local Access From Your Laptop

Because the services bind to localhost on the VPS, use SSH tunnels:

```bash
ssh -L 3001:127.0.0.1:3001 \
    -L 9090:127.0.0.1:9090 \
    -L 9093:127.0.0.1:9093 \
    -L 3100:127.0.0.1:3100 \
    <user>@<vps-ip>
```

Then open:

- Grafana: `http://localhost:3001`
- Prometheus: `http://localhost:9090`
- Alertmanager: `http://localhost:9093`
- Loki API: `http://localhost:3100/ready`

## Smoke Test

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile observability ps

curl -fsS http://127.0.0.1:9090/-/ready
curl -fsS http://127.0.0.1:9093/-/ready
curl -fsS http://127.0.0.1:3001/api/health
curl -fsS http://127.0.0.1:3100/ready
```

Check Prometheus targets:

```bash
curl -fsS 'http://127.0.0.1:9090/api/v1/targets' | jq '.data.activeTargets[] | {job: .labels.job, health: .health, lastError: .lastError}'
```

Expected jobs:

- `library74-backend`
- `library74-cadvisor`
- `library74-node`
- `library74-prometheus`
- `library74-alertmanager`

Check alert rules:

```bash
curl -fsS 'http://127.0.0.1:9090/api/v1/rules' | jq '.data.groups[].rules[] | {name: .name, state: .state}'
curl -fsS 'http://127.0.0.1:9093/api/v2/alerts' | jq
```

Send a manual Telegram alert through the internal webhook:

```bash
docker exec -i lms_telegram_alert_webhook python - <<'PY'
import json
import urllib.request

payload = {
    "receiver": "local-dashboard",
    "status": "firing",
    "alerts": [
        {
            "status": "firing",
            "labels": {
                "alertname": "Library74TelegramTest",
                "severity": "info",
                "job": "manual-test",
            },
            "annotations": {
                "summary": "Telegram alert pipeline is working",
                "description": "Alertmanager -> telegram-alert-webhook -> Telegram Bot API.",
            },
        }
    ],
    "commonLabels": {"alertname": "Library74TelegramTest", "severity": "info"},
}

request = urllib.request.Request(
    "http://127.0.0.1:9094/alert",
    data=json.dumps(payload).encode(),
    headers={"Content-Type": "application/json"},
    method="POST",
)
with urllib.request.urlopen(request, timeout=15) as response:
    print(response.status)
    print(response.read().decode())
PY
```

Check Loki log ingestion:

```bash
curl -G -s 'http://127.0.0.1:3100/loki/api/v1/labels' | jq
curl -G -s 'http://127.0.0.1:3100/loki/api/v1/query' --data-urlencode 'query={job="docker"}' | jq
```

## Alert Rules Included

- Backend metrics endpoint down.
- cAdvisor down.
- Backend HTTP p95 latency above 3 seconds.
- Backend 5xx error rate above 2%.
- Main container memory above 85%.
- Main container CPU above 85% of one core.
- Main container filesystem above 85%.
- Host disk above 85%.
- Hikari database connection pool above 85%.

## Telegram Notifications

Alertmanager sends alerts to an internal `telegram-alert-webhook` service. The webhook reads `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` from `.env.prod`, formats the Alertmanager payload, and calls Telegram Bot API.

Alerts also remain visible in Alertmanager UI.

To switch to another receiver later, edit `deploy/alertmanager.yml` on the server and add one of:

- `email_configs` for SMTP.
- `webhook_configs` for a private webhook bridge.
- Slack/Discord/Telegram bridge webhook.

After editing:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile observability restart alertmanager
curl -fsS http://127.0.0.1:9093/-/ready
```

## Config Validation

Run before deploying:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile observability config >/tmp/library74-compose-observability.yml

docker run --rm --entrypoint promtool \
  -v "$PWD/deploy/prometheus.yml:/etc/prometheus/prometheus.yml:ro" \
  -v "$PWD/deploy/prometheus-rules:/etc/prometheus/rules:ro" \
  prom/prometheus:v2.55.1 check config /etc/prometheus/prometheus.yml

docker run --rm --entrypoint amtool \
  -v "$PWD/deploy/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro" \
  prom/alertmanager:v0.27.0 check-config /etc/alertmanager/alertmanager.yml

docker run --rm \
  -v "$PWD/deploy/loki.yml:/etc/loki/loki.yml:ro" \
  grafana/loki:3.3.2 -config.file=/etc/loki/loki.yml -verify-config

docker run --rm \
  -v "$PWD/deploy/promtail.yml:/etc/promtail/promtail.yml:ro" \
  grafana/promtail:3.3.2 -config.file=/etc/promtail/promtail.yml -check-syntax
```
