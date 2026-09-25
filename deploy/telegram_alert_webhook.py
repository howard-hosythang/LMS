from __future__ import annotations

import html
import json
import os
import sys
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer


TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
PORT = int(os.environ.get("TELEGRAM_ALERT_WEBHOOK_PORT", "9094"))


def _escape(value: object) -> str:
    return html.escape(str(value or ""), quote=False)


def _format_alert(alert: dict) -> str:
    labels = alert.get("labels") or {}
    annotations = alert.get("annotations") or {}
    status = alert.get("status", "unknown").upper()
    alertname = labels.get("alertname", "Alert")
    severity = labels.get("severity", "unknown")
    summary = annotations.get("summary", "")
    description = annotations.get("description", "")
    instance = labels.get("instance") or labels.get("name") or labels.get("job") or ""

    lines = [
        f"<b>{_escape(status)} - {_escape(alertname)}</b>",
        f"Severity: <code>{_escape(severity)}</code>",
    ]
    if instance:
        lines.append(f"Target: <code>{_escape(instance)}</code>")
    if summary:
        lines.append(f"Summary: {_escape(summary)}")
    if description:
        lines.append(f"Detail: {_escape(description)}")
    return "\n".join(lines)


def _build_message(payload: dict) -> str:
    status = payload.get("status", "unknown").upper()
    receiver = payload.get("receiver", "alertmanager")
    alerts = payload.get("alerts") or []
    common_labels = payload.get("commonLabels") or {}

    title = f"<b>Library74 Alertmanager - {_escape(status)}</b>"
    group = common_labels.get("alertname") or common_labels.get("severity") or receiver
    parts = [
        title,
        f"Group: <code>{_escape(group)}</code>",
        f"Alerts: <code>{len(alerts)}</code>",
        "",
    ]

    for alert in alerts[:8]:
        parts.append(_format_alert(alert))
        parts.append("")
    if len(alerts) > 8:
        parts.append(f"... and {len(alerts) - 8} more alerts")

    message = "\n".join(parts).strip()
    return message[:3900]


def _send_telegram(message: str) -> tuple[int, str]:
    if not TOKEN or not CHAT_ID:
        return 500, "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing"

    data = urllib.parse.urlencode(
        {
            "chat_id": CHAT_ID,
            "text": message,
            "parse_mode": "HTML",
            "disable_web_page_preview": "true",
        }
    ).encode()
    request = urllib.request.Request(
        f"https://api.telegram.org/bot{TOKEN}/sendMessage",
        data=data,
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return response.status, response.read().decode("utf-8", errors="replace")
    except Exception as exc:
        return 502, str(exc)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path != "/health":
            self.send_response(404)
            self.end_headers()
            return
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok\n")

    def do_POST(self) -> None:
        if self.path != "/alert":
            self.send_response(404)
            self.end_headers()
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length)
        try:
            payload = json.loads(raw_body)
        except json.JSONDecodeError as exc:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(f"invalid json: {exc}".encode())
            return

        status, body = _send_telegram(_build_message(payload))
        self.send_response(200 if 200 <= status < 300 else 502)
        self.end_headers()
        self.wfile.write(body.encode())

    def log_message(self, fmt: str, *args: object) -> None:
        sys.stdout.write("%s - %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"telegram alert webhook listening on :{PORT}", flush=True)
    server.serve_forever()
