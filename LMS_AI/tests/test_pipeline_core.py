from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

import pytest

import ai_etl.pipeline as pipeline_module
from ai_etl.pdf_processing import Chunk
from ai_etl.llm_client import LLMResponseError
from ai_etl.pipeline import AIEtlPipeline


class FakeDatabase:
    def __init__(self) -> None:
        self.calls: list[tuple[str, tuple, dict]] = []

    def upsert_publication_translation(self, *args, **kwargs) -> None:
        self.calls.append(("upsert_publication_translation", args, kwargs))

    def upsert_tag_translations(self, *args, **kwargs) -> None:
        self.calls.append(("upsert_tag_translations", args, kwargs))


class FakeRunDatabase(FakeDatabase):
    def ensure_etl_metadata_table(self, conn) -> None:
        self.calls.append(("ensure_etl_metadata_table", (conn,), {}))

    def mark_publication_etl_running(self, *args, **kwargs) -> None:
        self.calls.append(("mark_publication_etl_running", args, kwargs))

    def mark_publication_etl_failed(self, *args, **kwargs) -> None:
        self.calls.append(("mark_publication_etl_failed", args, kwargs))


class FakeLlm:
    def __init__(self, result=None, translation=None, should_fail: bool = False) -> None:
        self.result = result
        self.translation = translation
        self.should_fail = should_fail

    def reduce_publication(self, reduce_inputs, publication_context):
        if self.should_fail:
            raise RuntimeError("LLM unavailable")
        return self.result

    def translate_catalog_metadata(self, **kwargs):
        if self.should_fail:
            raise RuntimeError("translation unavailable")
        return self.translation


def _pipeline(settings=None, llm=None, database=None) -> AIEtlPipeline:
    pipeline = AIEtlPipeline.__new__(AIEtlPipeline)
    pipeline.settings = settings or SimpleNamespace(
        reduce_max_chunks=8,
        reduce_max_chars_per_chunk=20,
        reduce_total_chars_budget=42,
        chunk_size=1500,
        chunk_overlap=150,
        enable_hash_skip=True,
        allow_metadata_fallback=False,
        enable_ocr_fallback=True,
        ocr_max_pages=32,
        ocr_dpi=160,
        ocr_language="eng+vie",
        ocr_min_text_chars=500,
    )
    pipeline.llm_client = llm or FakeLlm()
    pipeline.database = database or FakeDatabase()
    return pipeline


def test_select_representative_chunks_keeps_opening_context_and_diverse_centroid() -> None:
    pipeline = _pipeline()
    chunks = [
        Chunk("c00001", "intro"),
        Chunk("c00002", "database normalization"),
        Chunk("c00003", "sql indexing"),
        Chunk("c00004", "deep learning"),
        Chunk("c00005", "transaction recovery"),
    ]
    vectors = [
        [1.0, 0.0, 0.0],
        [0.9, 0.1, 0.0],
        [0.8, 0.2, 0.0],
        [0.0, 1.0, 0.0],
        [0.7, 0.3, 0.0],
    ]

    selected = pipeline._select_representative_chunks(chunks, vectors, max_chunks=3)

    assert selected[0] == "intro"
    assert "database normalization" in selected
    assert len(selected) == 3


def test_select_representative_chunks_prefers_content_over_front_matter() -> None:
    pipeline = _pipeline()
    chunks = [
        Chunk(
            "c00001",
            "Copyright 2024 Publisher. All rights reserved. ISBN 123456789. "
            "No liability is assumed by the publisher for incidental damages. "
            "Table of contents Chapter 1 12 Chapter 2 35 Chapter 3 51.",
        ),
        Chunk(
            "c00002",
            "Chapter 4 75 The Purpose of Formatting 76 Vertical Openness 77 "
            "Chapter 6 Objects and Data Structures 95 Chapter 7 Error Handling 103.",
        ),
        Chunk(
            "c00003",
            "Refactoring improves the design of existing code by changing internal structure without changing "
            "observable behavior. The text explains how tests protect each small transformation, how code smells "
            "reveal design problems, and how programmers can move methods, extract classes, and simplify conditionals "
            "in a controlled sequence of steps.",
        ),
        Chunk(
            "c00004",
            "Clean code emphasizes names, functions, error handling, tests, and boundaries so that a software system "
            "can remain understandable while it evolves. The discussion connects daily programming discipline with "
            "professional responsibility, maintainability, and the cost of leaving bad code inside a project.",
        ),
    ]
    vectors = [
        [1.0, 0.0, 0.0],
        [0.9, 0.1, 0.0],
        [0.0, 1.0, 0.0],
        [0.0, 0.9, 0.1],
    ]

    selected = pipeline._select_representative_chunks(chunks, vectors, max_chunks=2)

    joined = " ".join(selected).lower()
    assert "copyright" not in joined
    assert "table of contents" not in joined
    assert "refactoring improves" in joined
    assert "clean code emphasizes" in joined


def test_apply_reduce_budget_cleans_and_stops_before_total_budget() -> None:
    pipeline = _pipeline(SimpleNamespace(reduce_max_chars_per_chunk=15, reduce_total_chars_budget=32))

    selected = pipeline._apply_reduce_budget([
        "Title: noisy catalog field. Real content about database normalization and SQL.",
        "Second sentence about indexing and transactions.",
        "Third sentence should not fit in the reduce budget.",
    ])

    assert selected == ["Real content ab", "Second sentence"]


def test_reduce_with_fallback_uses_llm_result_when_available() -> None:
    expected = {
        "master_summary": (
            "Tài liệu trình bày cách thiết kế cơ sở dữ liệu quan hệ thông qua mô hình dữ liệu, SQL, "
            "chuẩn hóa lược đồ và ràng buộc toàn vẹn. Nội dung nhấn mạnh cách tổ chức bảng, chỉ mục "
            "và truy vấn để hệ thống phần mềm lưu trữ dữ liệu nhất quán. Các đoạn đại diện cũng đề cập "
            "đến giao dịch, điều khiển đồng thời và khôi phục khi nhiều thao tác cùng xảy ra. Người đọc "
            "có thể dùng tài liệu để xây dựng nền tảng phân tích, thiết kế và vận hành cơ sở dữ liệu."
        ),
        "audience": "KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH",
        "tags": ["SQL", "Chuẩn Hóa Dữ Liệu", "Chỉ Mục Dữ Liệu", "Truy Vấn Dữ Liệu", "Giao Dịch Dữ Liệu"],
        "tags_en": ["SQL", "Database Normalization", "Database Indexing", "Database Queries", "Data Transactions"],
    }
    pipeline = _pipeline(llm=FakeLlm(result=expected))

    assert pipeline._reduce_with_fallback(["content"], "") == expected


def test_reduce_with_fallback_rejects_llm_failures_by_default() -> None:
    pipeline = _pipeline(llm=FakeLlm(should_fail=True))

    with pytest.raises(LLMResponseError, match="FALLBACK is disabled"):
        pipeline._reduce_with_fallback(
            [
                "Supervised learning studies labelled examples, regression, classification, feature engineering, "
                "model validation, overfitting control and error analysis for prediction workflows."
            ],
            "Title: Machine Learning cơ bản\nCategories: Công Nghệ Thông Tin",
        )


def test_reduce_with_fallback_can_be_enabled_explicitly() -> None:
    settings = SimpleNamespace(
        reduce_max_chunks=8,
        reduce_max_chars_per_chunk=20,
        reduce_total_chars_budget=42,
        chunk_size=1500,
        chunk_overlap=150,
        enable_hash_skip=True,
        allow_metadata_fallback=True,
        enable_ocr_fallback=True,
        ocr_max_pages=32,
        ocr_dpi=160,
        ocr_language="eng+vie",
        ocr_min_text_chars=500,
    )
    pipeline = _pipeline(settings=settings, llm=FakeLlm(should_fail=True))

    result = pipeline._reduce_with_fallback(
        [
            "Supervised learning studies labelled examples, regression, classification, feature engineering, "
            "model validation, overfitting control and error analysis for prediction workflows."
        ],
        "Title: Machine Learning cơ bản\nCategories: Công Nghệ Thông Tin",
    )

    assert "regression" in result["master_summary"] or "classification" in result["master_summary"]
    assert 3 <= len(result["tags"]) <= 5
    assert result["tags_en"]
    assert result["audience"] == "KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH"
    assert result["fallback_used"] is True
    assert "Original error: LLM unavailable" in result["fallback_reason"]


def test_reduce_with_fallback_preserves_original_gemini_error_when_disabled() -> None:
    pipeline = _pipeline(llm=FakeLlm(should_fail=True))

    with pytest.raises(LLMResponseError) as exc_info:
        pipeline._reduce_with_fallback(
            ["database indexing transactions and query optimization"],
            "Title: Database Systems",
        )

    message = str(exc_info.value)
    assert "Gemini metadata generation failed" in message
    assert "AI_ETL_ALLOW_METADATA_FALLBACK is disabled" in message
    assert "Original error: LLM unavailable" in message


def test_try_upsert_english_metadata_writes_optional_translation_and_tag_aliases() -> None:
    database = FakeDatabase()
    llm = FakeLlm(translation={
        "title": "Database Systems",
        "subtitle": None,
        "description": "Relational database design.",
        "ai_summary": "The document covers normalization and transactions.",
        "tags": ["SQL", "Database Normalization"],
    })
    pipeline = _pipeline(llm=llm, database=database)

    result = pipeline._try_upsert_english_metadata(
        conn=object(),
        publication_id=7,
        publication_context="Title: Hệ Cơ Sở Dữ Liệu",
        ai_summary_vi="Tài liệu trình bày chuẩn hóa dữ liệu.",
        tags=["SQL", "Chuẩn Hóa Dữ Liệu"],
        tag_ids=[10, 11],
    )

    assert result is True
    assert [call[0] for call in database.calls] == [
        "upsert_publication_translation",
        "upsert_tag_translations",
    ]
    assert database.calls[1][2]["translated_names"] == ["SQL", "Database Normalization"]


def test_try_upsert_english_metadata_is_best_effort() -> None:
    pipeline = _pipeline(llm=FakeLlm(should_fail=True), database=FakeDatabase())

    assert pipeline._try_upsert_english_metadata(object(), 1, "", "", [], []) is False


def test_run_fails_when_pdf_and_ocr_have_no_usable_text(monkeypatch) -> None:
    class FakeConn:
        def commit(self) -> None:
            pass

        def rollback(self) -> None:
            pass

    database = FakeRunDatabase()
    pipeline = _pipeline(database=database)

    def fake_extract_pdf_text(_path, **kwargs):
        assert kwargs["enable_ocr_fallback"] is True
        assert kwargs["ocr_max_pages"] == 32
        return ""

    monkeypatch.setattr(pipeline_module, "extract_pdf_text", fake_extract_pdf_text)

    with pytest.raises(ValueError, match="no usable extractable text"):
        pipeline._run_with_connection(
            conn=FakeConn(),
            publication_id=99,
            pdf_path="scan.pdf",
            file_hash="hash",
            force_reprocess=True,
        )

    assert [call[0] for call in database.calls] == [
        "ensure_etl_metadata_table",
        "mark_publication_etl_running",
        "mark_publication_etl_failed",
    ]


def test_calculate_file_hash_uses_content_for_files_and_url_string_for_remote_sources(tmp_path: Path) -> None:
    file_path = tmp_path / "book.pdf"
    file_path.write_bytes(b"same file content")

    assert AIEtlPipeline._calculate_file_hash(file_path) == AIEtlPipeline._calculate_file_hash(file_path)
    assert (
        AIEtlPipeline._calculate_file_hash("https://example.test/books/1.pdf")
        != AIEtlPipeline._calculate_file_hash("https://example.test/books/2.pdf")
    )
