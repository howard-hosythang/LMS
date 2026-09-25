from __future__ import annotations

from scripts.ai_quality_benchmark import (
    evaluate_ranked_cases,
    ndcg_at_k,
    precision_recall_f1,
    ranking_metrics,
    reliability_score,
    summary_quality,
)


def test_tag_precision_recall_f1_ignores_case_and_accents() -> None:
    result = precision_recall_f1(
        ["Học Máy", "Đánh Giá Mô Hình", "SQL"],
        ["hoc may", "Danh gia mo hinh", "Cơ Sở Dữ Liệu"],
    )

    assert result["precision"] == 2 / 3
    assert result["recall"] == 2 / 3
    assert round(result["f1"], 4) == 0.6667


def test_ranking_metrics_reward_relevant_items_near_top() -> None:
    result = ranking_metrics([101, 102, 103], [102, 999, 101, 888, 777], k=5)

    assert result["precision@5"] == 0.4
    assert result["recall@5"] == 2 / 3
    assert result["mrr"] == 1.0
    assert 0.0 < result["ndcg@5"] <= 1.0
    assert ndcg_at_k([101, 102], [101, 102], 2) == 1.0


def test_summary_quality_checks_coverage_length_and_forbidden_terms() -> None:
    result = summary_quality(
        "Tài liệu trình bày học máy, hồi quy, phân loại, kỹ thuật đặc trưng và đánh giá mô hình. "
        "Nội dung tập trung vào khả năng tổng quát hóa, kiểm soát overfitting và phân tích lỗi "
        "trong các bài toán dự đoán thực tế dành cho sinh viên kỹ thuật.",
        ["học máy", "hồi quy", "phân loại", "đặc trưng", "đánh giá mô hình"],
        ["SQL", "tiểu thuyết"],
    )

    assert result["keyword_coverage"] == 1.0
    assert result["length_ok"] == 1.0
    assert result["forbidden_hit_count"] == 0.0
    assert result["hallucination_guard"] == 1.0


def test_reliability_score_is_weighted_and_bounded() -> None:
    score = reliability_score(
        {"tag_f1": 0.9, "summary_keyword_coverage": 0.8, "summary_hallucination_guard_rate": 1.0},
        {"ndcg@5": 0.7},
        {"ndcg@5": 0.6},
        latency_ms_p95=100,
        latency_budget_ms=200,
        k=5,
    )

    assert 0 < score <= 100
    assert score == 81.5


def test_live_ranked_case_errors_are_reported_without_crashing() -> None:
    rows, aggregate, latencies = evaluate_ranked_cases(
        [
            {
                "id": "broken-live-case",
                "query": "database",
                "relevant_publication_ids": [1],
            }
        ],
        k=5,
        api_base_url="http://127.0.0.1:1",
        endpoint="semantic-search",
    )

    assert rows[0]["error"]
    assert rows[0]["returned_publication_ids"] == []
    assert aggregate["coverage_rate"] == 0.0
    assert latencies == []
