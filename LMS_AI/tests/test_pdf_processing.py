from __future__ import annotations

import pytest

from ai_etl.pdf_processing import (
    _clean_pdf_pages,
    _has_usable_ocr_text,
    _select_ocr_page_indices,
    clean_ocr_artifacts,
    sanitize_text,
    sliding_window_chunk,
)


def test_clean_pdf_pages_removes_repeated_page_furniture_and_noise() -> None:
    pages = [
        "Smart Library PDF\n1\nMachine learn-\ning models infer patterns from labelled examples.\nConfidential footer",
        "Smart Library PDF\n2\nRegression and classification workflows evaluate unseen data.\nConfidential footer",
        "Smart Library PDF\n3\nFeature engineering improves model quality and validation.\nConfidential footer",
    ]

    cleaned = _clean_pdf_pages(pages)

    assert "Smart Library PDF" not in cleaned
    assert "Confidential footer" not in cleaned
    assert "\x00" not in cleaned
    assert "Machine learning models" in cleaned
    assert "Regression and classification" in cleaned


def test_sanitize_text_removes_nulls_and_collapses_whitespace() -> None:
    assert sanitize_text("  A\x00I\n\n  service\tmetadata  ") == "AI service metadata"


def test_clean_ocr_artifacts_removes_broken_tokens_without_dropping_prose() -> None:
    raw = (
        "ws._ the execution of aprocessthat isnot completely inl1e1YI_cID~~ (Chapter 9). "
        "The virtual-memory scheme enables users to run programs that are larger than actual memory."
    )

    cleaned = clean_ocr_artifacts(raw)

    assert "inl1e1YI_cID" not in cleaned
    assert "ws._" not in cleaned
    assert "virtual-memory scheme" in cleaned


def test_sliding_window_chunk_creates_stable_ids_and_overlap() -> None:
    chunks = sliding_window_chunk("abcdefghijklmnopqrstuvwxyz", chunk_size=10, overlap=3)

    assert [chunk.chunk_id for chunk in chunks] == ["c00001", "c00002", "c00003", "c00004"]
    assert [chunk.text for chunk in chunks] == [
        "abcdefghij",
        "hijklmnopq",
        "opqrstuvwx",
        "vwxyz",
    ]


def test_sliding_window_chunk_rejects_invalid_window_parameters() -> None:
    with pytest.raises(ValueError, match="overlap must be smaller"):
        sliding_window_chunk("abc", chunk_size=3, overlap=3)

    with pytest.raises(ValueError, match="chunk_size must be positive"):
        sliding_window_chunk("abc", chunk_size=0, overlap=0)


def test_ocr_page_sampling_covers_opening_middle_and_end() -> None:
    indices = _select_ocr_page_indices(page_count=100, max_pages=12)

    assert indices[:4] == [0, 1, 2, 3]
    assert 99 in indices
    assert len(indices) == 12
    assert indices == sorted(set(indices))


def test_ocr_text_quality_requires_enough_alpha_text() -> None:
    assert _has_usable_ocr_text("Algorithms and data structures " * 30, min_text_chars=200)
    assert not _has_usable_ocr_text("12345 !!! " * 30, min_text_chars=100)
    assert not _has_usable_ocr_text("short text", min_text_chars=100)
