from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from ai_etl.llm_client import GeminiClient
from ai_etl.pdf_processing import extract_pdf_text, sliding_window_chunk
from ai_etl.pipeline import AIEtlPipeline


def _select_reduce_inputs(chunks: list[str], max_chunks: int = 6) -> list[str]:
    if len(chunks) <= max_chunks:
        return chunks

    selected_indices = {0, 1, len(chunks) // 2, len(chunks) - 2, len(chunks) - 1}
    selected = [chunks[index] for index in sorted(selected_indices) if 0 <= index < len(chunks)]
    return selected[:max_chunks]


def _build_client() -> GeminiClient:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("GEMINI_API_KEY is required in environment or .env")

    return GeminiClient(
        api_key=api_key,
        cheap_model=os.getenv("AI_ETL_GEMINI_MODEL_CHEAP", "gemini-2.5-flash-lite"),
        premium_model=os.getenv("AI_ETL_GEMINI_MODEL_PREMIUM", ""),
        timeout_seconds=int(os.getenv("AI_ETL_LLM_TIMEOUT_SECONDS", "30")),
        retry_attempts=int(os.getenv("AI_ETL_LLM_RETRY_ATTEMPTS", "2")),
        min_request_interval_seconds=float(os.getenv("AI_ETL_GEMINI_MIN_REQUEST_INTERVAL_SECONDS", "0")),
    )


def _public_result(
    pdf_path: Path,
    model_name: str,
    elapsed_seconds: float,
    extracted_chars: int,
    chunk_count: int,
    reduce_input_count: int,
    reduce_result: dict[str, Any],
) -> dict[str, Any]:
    return {
        "source_pdf": str(pdf_path),
        "model": model_name,
        "processing_seconds": round(elapsed_seconds, 3),
        "extracted_chars": extracted_chars,
        "chunks": chunk_count,
        "reduce_inputs": reduce_input_count,
        "master_summary": str(reduce_result["master_summary"]),
        "audience": str(reduce_result["audience"]),
        "tags": [str(tag) for tag in reduce_result["tags"]],
        "tags_en": [str(tag) for tag in reduce_result["tags_en"]],
    }


def _redact_error(exc: Exception) -> str:
    message = str(exc)
    message = re.sub(r"key=[^&\s]+", "key=<redacted>", message)
    message = re.sub(r"AIza[0-9A-Za-z_\\-]+", "<redacted>", message)
    return message


def _fallback_reduce_publication(reduce_inputs: list[str], context: str) -> dict[str, Any]:
    pipeline = object.__new__(AIEtlPipeline)
    result = pipeline._fallback_reduce_publication(reduce_inputs, context)
    return {
        "master_summary": str(result["master_summary"]),
        "audience": str(result["audience"]),
        "tags": [str(tag) for tag in result["tags"]],
        "tags_en": [str(tag) for tag in result["tags_en"]],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a live Gemini reduce test and save report JSON.")
    parser.add_argument("--pdf", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument(
        "--context",
        default=(
            "Title: Practical Machine Learning for Library Recommendation\n"
            "Categories: Artificial Intelligence, Recommender Systems\n"
            "Description: ứng dụng học máy để cải thiện tìm kiếm sách, gợi ý cá nhân hóa, "
            "embedding ngữ nghĩa, collaborative filtering và đánh giá hệ thống khuyến nghị "
            "trong thư viện đại học."
        ),
    )
    parser.add_argument(
        "--allow-fallback",
        action="store_true",
        help=(
            "If the live Gemini call fails, write a successful degraded artifact using "
            "the same deterministic fallback reducer used by the AI ETL pipeline."
        ),
    )
    args = parser.parse_args()

    load_dotenv()
    client = _build_client()

    start = time.perf_counter()
    text = extract_pdf_text(args.pdf)
    chunks = sliding_window_chunk(text, chunk_size=1500, overlap=150)
    chunk_texts = [chunk.text[:900] for chunk in chunks]
    reduce_inputs = _select_reduce_inputs(chunk_texts)
    try:
        reduce_result = client.reduce_publication(reduce_inputs, args.context)
        elapsed_seconds = time.perf_counter() - start
        result = _public_result(
            pdf_path=args.pdf,
            model_name=client.cheap_model,
            elapsed_seconds=elapsed_seconds,
            extracted_chars=len(text),
            chunk_count=len(chunks),
            reduce_input_count=len(reduce_inputs),
            reduce_result=reduce_result,
        )
    except Exception as exc:
        elapsed_seconds = time.perf_counter() - start
        error = _redact_error(exc)
        if args.allow_fallback:
            fallback_result = _fallback_reduce_publication(reduce_inputs, args.context)
            result = _public_result(
                pdf_path=args.pdf,
                model_name=client.cheap_model,
                elapsed_seconds=elapsed_seconds,
                extracted_chars=len(text),
                chunk_count=len(chunks),
                reduce_input_count=len(reduce_inputs),
                reduce_result=fallback_result,
            )
            result.update(
                {
                    "status": "PASSED_WITH_FALLBACK",
                    "live_status": "FAILED",
                    "fallback_used": True,
                    "live_error": error,
                }
            )
        else:
            result = {
                "source_pdf": str(args.pdf),
                "model": client.cheap_model,
                "processing_seconds": round(elapsed_seconds, 3),
                "extracted_chars": len(text),
                "chunks": len(chunks),
                "reduce_inputs": len(reduce_inputs),
                "status": "FAILED",
                "error": error,
            }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if result.get("status") == "FAILED":
        sys.exit(2)


if __name__ == "__main__":
    main()
