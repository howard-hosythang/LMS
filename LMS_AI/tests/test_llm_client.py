from __future__ import annotations

import json

import pytest

from ai_etl.llm_client import GeminiClient, LLMResponseError


class StubGeminiClient(GeminiClient):
    def __init__(self, responses: list[str]) -> None:
        super().__init__(
            api_key="test-key",
            cheap_model="cheap",
            premium_model="premium",
            timeout_seconds=1,
            retry_attempts=1,
            min_request_interval_seconds=0,
        )
        self.responses = responses
        self.calls: list[tuple[str, str]] = []

    def _call(self, prompt: str, model: str) -> str:
        self.calls.append((model, prompt))
        if not self.responses:
            raise LLMResponseError("no stub response")
        return self.responses.pop(0)


def test_extract_json_payload_recovers_markdown_wrapped_json() -> None:
    payload = GeminiClient.extract_json_payload(
        '```json\n{"tags": ["Học Máy"], "audience": "KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH"}\n```'
    )

    assert payload["tags"] == ["Học Máy"]


def test_extract_json_payload_rejects_malformed_model_output() -> None:
    with pytest.raises(LLMResponseError, match="not valid JSON"):
        GeminiClient.extract_json_payload("not json at all")


def test_extract_text_requires_candidates_parts_and_text() -> None:
    with pytest.raises(LLMResponseError, match="no candidates"):
        GeminiClient._extract_text({})
    with pytest.raises(LLMResponseError, match="no content parts"):
        GeminiClient._extract_text({"candidates": [{"content": {"parts": []}}]})
    with pytest.raises(LLMResponseError, match="empty text"):
        GeminiClient._extract_text({"candidates": [{"content": {"parts": [{"text": ""}]}}]})


def test_safe_error_message_redacts_gemini_api_key() -> None:
    message = (
        "400 Client Error: Bad Request for url: "
        "https://generativelanguage.googleapis.com/v1beta/models/gemini:generateContent?key=secret-api-key"
    )

    sanitized = GeminiClient._safe_error_message(RuntimeError(message))

    assert "secret-api-key" not in sanitized
    assert "key=<redacted>" in sanitized


def test_reduce_once_filters_tags_aligns_english_aliases_and_coerces_audience() -> None:
    client = StubGeminiClient([
        json.dumps({
            "master_summary": (
                "Tài liệu trình bày thiết kế cơ sở dữ liệu quan hệ, chuẩn hóa lược đồ, truy vấn SQL, "
                "chỉ mục và giao dịch. Nội dung tập trung vào cách xây dựng mô hình dữ liệu nhất quán, "
                "đánh giá ràng buộc toàn vẹn và tối ưu truy vấn cho các hệ thống phần mềm. "
                "Các phần nội dung cũng chỉ ra vai trò của giao dịch, khôi phục và tính nhất quán khi "
                "nhiều người dùng cùng thao tác trên dữ liệu. Người đọc có thể dùng tài liệu để nắm "
                "nền tảng thiết kế, vận hành và phân tích hiệu năng cơ sở dữ liệu."
            ),
            "audience": "computer science",
            "tags": ["Công Nghệ", "SQL", "Chuẩn Hóa Dữ Liệu", "Database System Concepts"],
            "tags_en": ["Technology", "SQL", "Database Normalization", "Book Title"],
        }, ensure_ascii=False)
    ])

    result = client._reduce_once(
        "cheap",
        [
            "Relational database design covers SQL joins, normalization, indexes, query plans, transactions "
            "and consistency rules for software systems."
        ],
        "Title: Database System Concepts\nCategories: Công Nghệ Thông Tin, Cơ Sở Dữ Liệu",
    )

    assert result["audience"] == "KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH"
    assert result["tags"] == [
        "SQL",
        "Chuẩn Hóa Dữ Liệu",
        "Mô Hình Dữ Liệu",
        "Xử Lý Truy Vấn",
    ]
    assert result["tags_en"] == [
        "SQL",
        "Database Normalization",
        "Data Modeling",
        "Query Processing",
    ]


def test_reduce_once_rejects_catalog_like_summary() -> None:
    client = StubGeminiClient([
        json.dumps({
            "master_summary": "Hệ thống AI lập chỉ mục metadata của thư viện và mô tả file PDF thuộc nhóm sách.",
            "audience": "KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH",
            "tags": ["Học Máy", "Học Sâu", "Khoa Học Dữ Liệu", "Mạng Nơ Ron", "Kỹ Thuật Đặc Trưng"],
            "tags_en": ["Machine Learning", "Deep Learning", "Data Science", "Neural Networks", "Feature Engineering"],
        }, ensure_ascii=False)
    ])

    with pytest.raises(LLMResponseError, match="catalog metadata"):
        client._reduce_once("cheap", ["Nội dung về machine learning."], "")


def test_reduce_once_rejects_english_dominant_summary() -> None:
    client = StubGeminiClient([
        json.dumps({
            "master_summary": (
                "When Breath Becomes Air is a memoir about patients, physicians, diagnosis and treatment. "
                "The book describes medical cases, family relationships and questions about life and death. "
                "It presents the author through hospital work, illness and personal reflection. "
                "Readers can understand the emotional pressure of medicine and the human side of clinical care."
            ),
            "audience": "TOAN_BO_SINH_VIEN_BKU",
            "tags": ["Hồi Ký", "Y Học", "Tự Truyện"],
            "tags_en": ["Memoir", "Medicine", "Autobiography"],
        }, ensure_ascii=False)
    ])

    with pytest.raises(LLMResponseError, match="Vietnamese"):
        client._reduce_once(
            "cheap",
            ["When Breath Becomes Air describes medical cases, patients, physicians and family relationships."],
            "Title: When Breath Becomes Air\nCategories: Biography & Autobiography",
        )


def test_reduce_once_removes_ocr_hedging_from_summary() -> None:
    client = StubGeminiClient([
        json.dumps({
            "master_summary": (
                "Các đoạn OCR cho thấy tài liệu tập trung vào thuật toán, phân tích thuật toán "
                "và các kỹ thuật lập trình nền tảng. Nội dung trình bày cấu trúc dữ liệu, "
                "độ phức tạp tính toán và cách thiết kế lời giải cho nhiều lớp bài toán. "
                "Hệ thống bài tập giúp người đọc rèn luyện tư duy phân tích, kiểm chứng độ đúng "
                "và lựa chọn chiến lược cài đặt phù hợp. Tác phẩm là nền tảng quan trọng cho "
                "sinh viên khoa học máy tính khi học sâu về thuật toán và cấu trúc dữ liệu. "
                "Do nguồn là OCR từ PDF dạng ảnh, bản tóm tắt này chỉ sử dụng những ý đọc được rõ ràng "
                "và tránh suy diễn ngoài văn bản."
            ),
            "audience": "KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH",
            "tags": ["Thuật Toán", "Cấu Trúc Dữ Liệu", "Phân Tích Độ Phức Tạp"],
            "tags_en": ["Algorithms", "Data Structures", "Complexity Analysis"],
        }, ensure_ascii=False)
    ])

    result = client._reduce_once(
        "cheap",
        [
            "Algorithms, data structures, complexity analysis, correctness proofs and exercises "
            "for computer science students."
        ],
        "Title: Introduction to Algorithms",
    )

    assert result["master_summary"].startswith("Tài liệu tập trung vào thuật toán")
    assert "OCR" not in result["master_summary"]
    assert "PDF dạng ảnh" not in result["master_summary"]
    assert "tránh suy diễn" not in result["master_summary"]


def test_translate_terms_requires_same_length_response() -> None:
    client = StubGeminiClient(['["Web Development"]'])

    with pytest.raises(LLMResponseError, match="length mismatch"):
        client.translate_terms(["Lập Trình Web", "Học Máy"])
