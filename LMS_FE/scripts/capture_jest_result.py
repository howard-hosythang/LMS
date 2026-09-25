#!/usr/bin/env python3
from __future__ import annotations

import datetime as dt
import html
import os
import re
import shutil
import subprocess
import sys
import textwrap
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT.parent / "latex" / "figures" / "test-results"
SVG_PATH = REPORT_DIR / "fe-jest-result.svg"
PNG_PATH = REPORT_DIR / "fe-jest-result.png"
TXT_PATH = REPORT_DIR / "fe-jest-result.txt"

ANSI_RE = re.compile(r"\x1b\[[0-9;]*m")


def strip_ansi(value: str) -> str:
    return ANSI_RE.sub("", value)


def wrap_lines(text: str, width: int = 118) -> list[str]:
    lines: list[str] = []
    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        if not line:
            lines.append("")
            continue
        lines.extend(textwrap.wrap(
            line,
            width=width,
            replace_whitespace=False,
            drop_whitespace=False,
            break_long_words=False,
            break_on_hyphens=False,
        ) or [""])
    return lines


def line_color(line: str) -> str:
    if line.startswith("Status: PASS") or line.startswith("PASS "):
        return "#86efac"
    if line.startswith("Status: FAIL") or line.startswith("FAIL "):
        return "#fca5a5"
    if any(key in line for key in ("Test Suites:", "Tests:", "Snapshots:", "Time:")):
        return "#93c5fd"
    if line.startswith("Command:") or line.startswith("Generated at:"):
        return "#cbd5e1"
    return "#e5e7eb"


def render_svg(command: str, output: str, return_code: int) -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status = "PASS" if return_code == 0 else "FAIL"
    header = [
        "Library74 LMS - Frontend Jest Result",
        f"Generated at: {now}",
        f"Command: {command}",
        f"Status: {status} (exit code {return_code})",
        "",
    ]
    lines = header + wrap_lines(output)

    width = 1680
    line_height = 34
    padding_x = 42
    padding_y = 44
    height = max(720, min(3200, padding_y * 2 + line_height * (len(lines) + 1)))

    text_nodes: list[str] = []
    y = padding_y
    for index, line in enumerate(lines):
        if y > height - padding_y - line_height:
            text_nodes.append(
                f'<text x="{padding_x}" y="{y}" fill="#f8fafc" class="body">... output truncated ...</text>'
            )
            break
        cls = "title" if index == 0 else "body"
        text_nodes.append(
            f'<text x="{padding_x}" y="{y}" fill="{line_color(line)}" class="{cls}">{html.escape(line)}</text>'
        )
        y += line_height

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <style>
    .title {{ font-family: Menlo, SFMono-Regular, Consolas, monospace; font-size: 32px; font-weight: 700; }}
    .body {{ font-family: Menlo, SFMono-Regular, Consolas, monospace; font-size: 26px; }}
  </style>
  <rect width="100%" height="100%" rx="18" fill="#0b1020"/>
  <rect x="18" y="18" width="{width - 36}" height="{height - 36}" rx="14" fill="none" stroke="#1f2937" stroke-width="2"/>
  {''.join(text_nodes)}
</svg>
"""
    SVG_PATH.write_text(svg, encoding="utf-8")


def try_convert_svg_to_png() -> bool:
    if not shutil.which("qlmanage"):
        return False
    temporary_png = REPORT_DIR / f"{SVG_PATH.name}.png"
    temporary_png.unlink(missing_ok=True)
    PNG_PATH.unlink(missing_ok=True)
    completed = subprocess.run(
        ["qlmanage", "-t", "-s", "1680", "-o", str(REPORT_DIR), str(SVG_PATH)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    if completed.returncode == 0 and temporary_png.exists():
        temporary_png.replace(PNG_PATH)
        return True
    return False


def main() -> int:
    command = "npx jest --config jest.config.cjs --runInBand --no-color"
    completed = subprocess.run(
        command,
        cwd=ROOT,
        shell=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        env={**os.environ, "FORCE_COLOR": "0"},
    )
    output = strip_ansi(completed.stdout)

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    TXT_PATH.write_text(output, encoding="utf-8")
    render_svg(command, output, completed.returncode)
    converted = try_convert_svg_to_png()

    sys.stdout.write(output)
    sys.stdout.write(f"\nSaved text report: {TXT_PATH}\n")
    sys.stdout.write(f"Saved SVG report: {SVG_PATH}\n")
    if converted:
        sys.stdout.write(f"Saved PNG report: {PNG_PATH}\n")
    else:
        sys.stdout.write("PNG conversion skipped; SVG report was still generated.\n")
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
