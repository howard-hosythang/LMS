#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import statistics
import time
import unicodedata
from pathlib import Path
from typing import Any


def fetch_metadata_outputs(db_url: str, publication_ids: list[int]) -> dict[int, dict[str, Any]]:
    if not publication_ids:
        return {}
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
    except ModuleNotFoundError as exc:
        raise RuntimeError("DB-backed benchmark mode requires psycopg2. Install LMS_AI requirements first.") from exc

    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT
                    p.id,
                    p.ai_summary,
                    COALESCE(
                        ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.id IS NOT NULL),
                        ARRAY[]::text[]
                    ) AS tags
                FROM public.publications p
                LEFT JOIN public.publication_tags pt ON pt.publication_id = p.id
                LEFT JOIN public.tags t ON t.id = pt.tag_id
                WHERE p.id = ANY(%s)
                GROUP BY p.id, p.ai_summary
                """,
                (publication_ids,),
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    return {
        int(row["id"]): {
            "summary": str(row["ai_summary"] or ""),
            "predicted_tags": [str(tag) for tag in row["tags"] or []],
        }
        for row in rows
    }


def normalize_text(value: str) -> str:
    text = unicodedata.normalize("NFKD", value or "")
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.replace("đ", "d").replace("Đ", "d")
    return " ".join(text.lower().strip().split())


def precision_recall_f1(expected: list[str], predicted: list[str]) -> dict[str, float]:
    expected_set = [normalize_text(item) for item in expected if item]
    predicted_set = [normalize_text(item) for item in predicted if item]
    if not expected_set and not predicted_set:
        return {"precision": 1.0, "recall": 1.0, "f1": 1.0}
    if not predicted_set:
        return {"precision": 0.0, "recall": 0.0, "f1": 0.0}

    def tag_similarity(left: str, right: str) -> float:
        if left == right:
            return 1.0
        left_tokens = set(left.split())
        right_tokens = set(right.split())
        if not left_tokens or not right_tokens:
            return 0.0
        intersection = len(left_tokens & right_tokens)
        union = len(left_tokens | right_tokens)
        return intersection / union if union else 0.0

    def matched_count(source: list[str], target: list[str]) -> int:
        return sum(
            1
            for source_tag in source
            if any(tag_similarity(source_tag, target_tag) >= 0.5 for target_tag in target)
        )

    precision = matched_count(predicted_set, expected_set) / len(predicted_set)
    recall = matched_count(expected_set, predicted_set) / len(expected_set) if expected_set else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if precision + recall else 0.0
    return {"precision": precision, "recall": recall, "f1": f1}


def precision_at_k(relevant_ids: list[int], returned_ids: list[int], k: int) -> float:
    if k <= 0:
        return 0.0
    relevant = set(relevant_ids)
    returned = returned_ids[:k]
    if not returned:
        return 0.0
    return sum(1 for item_id in returned if item_id in relevant) / k


def recall_at_k(relevant_ids: list[int], returned_ids: list[int], k: int) -> float:
    relevant = set(relevant_ids)
    if not relevant:
        return 0.0
    returned = returned_ids[:k]
    return sum(1 for item_id in returned if item_id in relevant) / len(relevant)


def mrr(relevant_ids: list[int], returned_ids: list[int]) -> float:
    relevant = set(relevant_ids)
    for index, item_id in enumerate(returned_ids, start=1):
        if item_id in relevant:
            return 1.0 / index
    return 0.0


def ndcg_at_k(relevant_ids: list[int], returned_ids: list[int], k: int) -> float:
    relevant = set(relevant_ids)
    gains = [1.0 if item_id in relevant else 0.0 for item_id in returned_ids[:k]]
    dcg = sum(gain / math.log2(index + 2) for index, gain in enumerate(gains))
    ideal_hits = min(len(relevant), k)
    ideal_dcg = sum(1.0 / math.log2(index + 2) for index in range(ideal_hits))
    return dcg / ideal_dcg if ideal_dcg else 0.0


def ranking_metrics(relevant_ids: list[int], returned_ids: list[int], k: int) -> dict[str, float]:
    return {
        f"precision@{k}": precision_at_k(relevant_ids, returned_ids, k),
        f"recall@{k}": recall_at_k(relevant_ids, returned_ids, k),
        "mrr": mrr(relevant_ids, returned_ids),
        f"ndcg@{k}": ndcg_at_k(relevant_ids, returned_ids, k),
        "non_empty": 1.0 if returned_ids else 0.0,
    }


def summary_quality(summary: str, source_keywords: list[str], forbidden_terms: list[str]) -> dict[str, float]:
    normalized_summary = normalize_text(summary)
    keywords = [normalize_text(item) for item in source_keywords if item]
    forbidden = [normalize_text(item) for item in forbidden_terms if item]
    covered = sum(1 for keyword in keywords if keyword in normalized_summary)
    forbidden_hits = sum(1 for term in forbidden if term in normalized_summary)
    word_count = len(normalized_summary.split())
    coverage = covered / len(keywords) if keywords else 0.0
    length_ok = 1.0 if 35 <= word_count <= 320 else 0.0
    hallucination_penalty = 1.0 if forbidden_hits == 0 else 0.0
    return {
        "keyword_coverage": coverage,
        "length_ok": length_ok,
        "forbidden_hit_count": float(forbidden_hits),
        "hallucination_guard": hallucination_penalty,
    }


def average_metric(rows: list[dict[str, float]], metric: str) -> float:
    values = [row.get(metric, 0.0) for row in rows]
    return statistics.fmean(values) if values else 0.0


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    sorted_values = sorted(values)
    if len(sorted_values) == 1:
        return sorted_values[0]
    rank = (len(sorted_values) - 1) * p
    low = math.floor(rank)
    high = math.ceil(rank)
    if low == high:
        return sorted_values[low]
    return sorted_values[low] + (sorted_values[high] - sorted_values[low]) * (rank - low)


def post_json(api_base_url: str, path: str, payload: dict[str, Any]) -> tuple[dict[str, Any], float]:
    try:
        import requests
    except ModuleNotFoundError as exc:
        raise RuntimeError("Live API mode requires the 'requests' package. Install LMS_AI requirements first.") from exc

    started = time.perf_counter()
    response = requests.post(f"{api_base_url.rstrip('/')}{path}", json=payload, timeout=10)
    elapsed_ms = (time.perf_counter() - started) * 1000
    response.raise_for_status()
    return response.json(), elapsed_ms


def get_nested_value(payload: dict[str, Any], path: str) -> Any:
    current: Any = payload
    for part in path.split("."):
        if not part:
            continue
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


def evaluate_metadata(
    cases: list[dict[str, Any]],
    metadata_outputs: dict[int, dict[str, Any]] | None = None,
) -> tuple[list[dict[str, Any]], dict[str, float]]:
    rows: list[dict[str, Any]] = []
    for case in cases:
        output = metadata_outputs.get(int(case["publication_id"]), {}) if metadata_outputs and case.get("publication_id") else {}
        predicted_tags = case.get("predicted_tags", output.get("predicted_tags", []))
        summary = case.get("summary", output.get("summary", ""))
        tag_scores = precision_recall_f1(case.get("expected_tags", []), predicted_tags)
        summary_scores = summary_quality(
            summary,
            case.get("source_keywords", []),
            case.get("forbidden_terms", []),
        )
        rows.append({
            "id": case.get("id"),
            "publication_id": case.get("publication_id"),
            "predicted_tags": predicted_tags,
            **tag_scores,
            **summary_scores,
        })

    aggregate = {
        "tag_precision": average_metric(rows, "precision"),
        "tag_recall": average_metric(rows, "recall"),
        "tag_f1": average_metric(rows, "f1"),
        "summary_keyword_coverage": average_metric(rows, "keyword_coverage"),
        "summary_length_ok_rate": average_metric(rows, "length_ok"),
        "summary_hallucination_guard_rate": average_metric(rows, "hallucination_guard"),
        "case_count": float(len(rows)),
    }
    return rows, aggregate


def evaluate_ranked_cases(
    cases: list[dict[str, Any]],
    *,
    k: int,
    api_base_url: str | None = None,
    endpoint: str | None = None,
    semantic_path: str = "/api/v1/semantic-search",
    semantic_query_field: str = "query_text",
    semantic_ids_path: str = "publication_ids",
) -> tuple[list[dict[str, Any]], dict[str, float], list[float]]:
    rows: list[dict[str, Any]] = []
    latencies: list[float] = []

    for case in cases:
        returned_ids = [int(item) for item in case.get("returned_publication_ids", [])]
        error: str | None = None
        if api_base_url and endpoint:
            try:
                if endpoint == "semantic-search":
                    body, elapsed_ms = post_json(
                        api_base_url,
                        semantic_path,
                        {semantic_query_field: case["query"], "limit": k},
                    )
                    returned_ids = [int(item) for item in (get_nested_value(body, semantic_ids_path) or [])]
                elif endpoint == "recommendations":
                    body, elapsed_ms = post_json(
                        api_base_url,
                        "/api/v1/recommendations",
                        {"user_id": int(case["user_id"]), "limit": k},
                    )
                    returned_ids = [int(item) for item in body.get("publication_ids", [])]
                else:
                    raise ValueError(f"Unsupported endpoint: {endpoint}")
                latencies.append(elapsed_ms)
            except Exception as exc:
                returned_ids = []
                error = str(exc)

        metrics = ranking_metrics(
            [int(item) for item in case.get("relevant_publication_ids", [])],
            returned_ids,
            k,
        )
        rows.append({"id": case.get("id"), "returned_publication_ids": returned_ids, "error": error, **metrics})

    aggregate = {
        f"precision@{k}": average_metric(rows, f"precision@{k}"),
        f"recall@{k}": average_metric(rows, f"recall@{k}"),
        "mrr": average_metric(rows, "mrr"),
        f"ndcg@{k}": average_metric(rows, f"ndcg@{k}"),
        "coverage_rate": average_metric(rows, "non_empty"),
        "case_count": float(len(rows)),
    }
    return rows, aggregate, latencies


def reliability_score(
    metadata: dict[str, float],
    search: dict[str, float],
    recommendations: dict[str, float],
    latency_ms_p95: float,
    latency_budget_ms: float,
    k: int,
) -> float:
    latency_score = max(0.0, min(1.0, latency_budget_ms / latency_ms_p95)) if latency_ms_p95 else 1.0
    components: list[tuple[float, float]] = []
    metadata_available = metadata.get("case_count", 1.0 if "tag_f1" in metadata else 0.0) > 0
    search_available = search.get("case_count", 1.0 if f"ndcg@{k}" in search else 0.0) > 0
    recommendation_available = recommendations.get(
        "case_count",
        1.0 if f"ndcg@{k}" in recommendations else 0.0,
    ) > 0

    if metadata_available:
        components.extend([
            (0.25, metadata.get("tag_f1", 0.0)),
            (0.20, metadata.get("summary_keyword_coverage", 0.0)),
            (0.10, metadata.get("summary_hallucination_guard_rate", 0.0)),
        ])
    if search_available:
        components.append((0.20, search.get(f"ndcg@{k}", 0.0)))
    if recommendation_available:
        components.append((0.15, recommendations.get(f"ndcg@{k}", 0.0)))
    if latency_ms_p95:
        components.append((0.10, latency_score))

    total_weight = sum(weight for weight, _value in components)
    score = sum(weight * value for weight, value in components) / total_weight if total_weight else 0.0
    return round(score * 100, 2)


def to_markdown(report: dict[str, Any]) -> str:
    def pct(value: float) -> str:
        return f"{value * 100:.1f}%"

    k = report["k"]
    metadata = report["aggregate"]["metadata"]
    search = report["aggregate"]["search"]
    recommendations = report["aggregate"]["recommendations"]
    latency = report["latency_ms"]

    lines = [
        "# AI Quality Benchmark Report",
        "",
        f"- Reliability score: **{report['reliability_score']}/100**",
        f"- Ranking cutoff: top-{k}",
        f"- Live API mode: {'yes' if report['live_api_mode'] else 'no'}",
        "",
        "## Metadata quality",
        "",
        "| Metric | Value |",
        "| --- | ---: |",
        f"| Tag precision | {pct(metadata['tag_precision'])} |",
        f"| Tag recall | {pct(metadata['tag_recall'])} |",
        f"| Tag F1 | {pct(metadata['tag_f1'])} |",
        f"| Summary keyword coverage | {pct(metadata['summary_keyword_coverage'])} |",
        f"| Summary length OK rate | {pct(metadata['summary_length_ok_rate'])} |",
        f"| Hallucination guard pass rate | {pct(metadata['summary_hallucination_guard_rate'])} |",
        "",
        "## Semantic search",
        "",
        "| Metric | Value |",
        "| --- | ---: |",
        f"| Precision@{k} | {pct(search[f'precision@{k}'])} |",
        f"| Recall@{k} | {pct(search[f'recall@{k}'])} |",
        f"| MRR | {search['mrr']:.3f} |",
        f"| nDCG@{k} | {search[f'ndcg@{k}']:.3f} |",
        f"| Coverage | {pct(search['coverage_rate'])} |",
        "",
        "## Recommendation",
        "",
    ]
    if recommendations.get("case_count", 0.0) > 0:
        lines.extend([
            "| Metric | Value |",
            "| --- | ---: |",
            f"| Precision@{k} | {pct(recommendations[f'precision@{k}'])} |",
            f"| Recall@{k} | {pct(recommendations[f'recall@{k}'])} |",
            f"| MRR | {recommendations['mrr']:.3f} |",
            f"| nDCG@{k} | {recommendations[f'ndcg@{k}']:.3f} |",
            f"| Coverage | {pct(recommendations['coverage_rate'])} |",
            "",
        ])
    else:
        lines.extend([
            "Not evaluated in this report because no curated user-profile ground truth was provided.",
            "",
        ])
    lines.extend([
        "## Latency",
        "",
        "| Metric | Value |",
        "| --- | ---: |",
        f"| p50 | {latency['p50']:.2f} ms |",
        f"| p95 | {latency['p95']:.2f} ms |",
        f"| Budget | {latency['budget']:.2f} ms |",
    ])
    return "\n".join(lines) + "\n"


def build_report(args: argparse.Namespace) -> dict[str, Any]:
    dataset = json.loads(Path(args.dataset).read_text(encoding="utf-8"))
    metadata_cases = dataset.get("metadata_cases", [])
    metadata_outputs = {}
    if args.db_url:
        publication_ids = [
            int(case["publication_id"])
            for case in metadata_cases
            if case.get("publication_id")
        ]
        metadata_outputs = fetch_metadata_outputs(args.db_url, publication_ids)
    metadata_rows, metadata_aggregate = evaluate_metadata(metadata_cases, metadata_outputs)
    search_rows, search_aggregate, search_latencies = evaluate_ranked_cases(
        dataset.get("search_cases", []),
        k=args.k,
        api_base_url=args.api_base_url,
        endpoint="semantic-search" if args.api_base_url else None,
        semantic_path=args.semantic_path,
        semantic_query_field=args.semantic_query_field,
        semantic_ids_path=args.semantic_ids_path,
    )
    recommendation_rows, recommendation_aggregate, recommendation_latencies = evaluate_ranked_cases(
        dataset.get("recommendation_cases", []),
        k=args.k,
        api_base_url=args.api_base_url,
        endpoint="recommendations" if args.api_base_url else None,
    )

    latencies = [*search_latencies, *recommendation_latencies]
    latency_p50 = percentile(latencies, 0.50)
    latency_p95 = percentile(latencies, 0.95)
    report = {
        "k": args.k,
        "live_api_mode": bool(args.api_base_url),
        "aggregate": {
            "metadata": metadata_aggregate,
            "search": search_aggregate,
            "recommendations": recommendation_aggregate,
        },
        "latency_ms": {
            "p50": latency_p50,
            "p95": latency_p95,
            "budget": args.latency_budget_ms,
        },
        "reliability_score": reliability_score(
            metadata_aggregate,
            search_aggregate,
            recommendation_aggregate,
            latency_p95,
            args.latency_budget_ms,
            args.k,
        ),
        "cases": {
            "metadata": metadata_rows,
            "search": search_rows,
            "recommendations": recommendation_rows,
        },
    }
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate LMS AI quality metrics.")
    parser.add_argument(
        "--dataset",
        default="evaluation/ai_quality_cases.sample.json",
        help="Path to a JSON benchmark dataset.",
    )
    parser.add_argument("--k", type=int, default=5, help="Ranking cutoff for search/recommendation metrics.")
    parser.add_argument("--api-base-url", default=None, help="Optional live AI API base URL, e.g. http://127.0.0.1:8001")
    parser.add_argument("--semantic-path", default="/api/v1/semantic-search")
    parser.add_argument("--semantic-query-field", default="query_text")
    parser.add_argument("--semantic-ids-path", default="publication_ids")
    parser.add_argument("--db-url", default=None, help="Optional PostgreSQL URL to read current AI summary/tags by publication_id.")
    parser.add_argument("--latency-budget-ms", type=float, default=200.0)
    parser.add_argument("--json-out", default=None)
    parser.add_argument("--md-out", default=None)
    args = parser.parse_args()

    report = build_report(args)
    rendered_json = json.dumps(report, ensure_ascii=False, indent=2)
    print(rendered_json)

    if args.json_out:
        Path(args.json_out).write_text(rendered_json + "\n", encoding="utf-8")
    if args.md_out:
        Path(args.md_out).write_text(to_markdown(report), encoding="utf-8")


if __name__ == "__main__":
    main()
