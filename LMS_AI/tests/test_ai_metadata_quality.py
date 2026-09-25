from __future__ import annotations

import sys
import types

sys.modules.setdefault("fitz", types.SimpleNamespace())

from ai_etl.pipeline import AIEtlPipeline
from ai_etl.llm_client import GeminiClient
from ai_etl.pdf_processing import strip_legal_and_publisher_boilerplate, strip_public_domain_boilerplate
from ai_etl.tag_quality import align_english_tags, dedupe_quality_tags, is_low_quality_tag


def test_fallback_metadata_prefers_specific_catalog_tags() -> None:
    pipeline = AIEtlPipeline.__new__(AIEtlPipeline)

    context = {
        "title": "Database System Concepts",
        "description": "SQL, relational design, normalization, indexing, transactions, concurrency control and recovery.",
        "categories": "Cơ Sở Dữ Liệu, Công Nghệ Thông Tin",
    }

    tags = pipeline._extract_fallback_tags(
        "relational database sql transaction normalization indexing query processing recovery",
        context,
        "Title: Database System Concepts\nCategories: Cơ Sở Dữ Liệu, Công Nghệ Thông Tin",
    )

    assert "SQL" in tags
    assert "Chuẩn Hóa Dữ Liệu" in tags
    assert "Giao Dịch Dữ Liệu" in tags
    assert "Cơ Sở Dữ Liệu" not in tags
    assert "Công Nghệ" not in tags
    assert "Database System Concepts" not in tags
    assert len(tags) == 5


def test_llm_tag_padding_keeps_specific_tags() -> None:
    tags = GeminiClient._fallback_tags_from_text(
        "Tài liệu trình bày machine learning, deep learning, neural network và data science analytics."
    )

    assert "Học Máy" in tags
    assert "Học Sâu" in tags
    assert "Khoa Học Dữ Liệu" in tags
    assert len(tags) <= 5


def test_ai_tag_quality_filters_title_category_and_generic_terms() -> None:
    context = "Title: Machine Learning cơ bản\nAuthors: Vũ Khắc Tiệp\nCategories: Công Nghệ Thông Tin, Lập Trình"

    tags = dedupe_quality_tags(
        [
            "Machine Learning cơ bản",
            "Công Nghệ Thông Tin",
            "Publication",
            "Học Có Giám Sát",
            "Kỹ Thuật Đặc Trưng",
            "Đánh Giá Mô Hình",
        ],
        context,
        limit=5,
    )

    assert tags == ["Học Có Giám Sát", "Kỹ Thuật Đặc Trưng", "Đánh Giá Mô Hình"]
    assert is_low_quality_tag("Publication")
    assert is_low_quality_tag("Nội Dung Chuyên Ngành")
    assert is_low_quality_tag("Phương Pháp Thực Hành")
    assert is_low_quality_tag("Ứng Dụng Thực Tế")


def test_medical_fallback_tags_are_specific_enough() -> None:
    tags = dedupe_quality_tags(
        GeminiClient._fallback_tags_from_text(
            "Giáo trình dược lý trình bày pharmacology, cơ chế drug action, drug therapy "
            "và clinical pharmacology trong thực hành điều trị."
        ),
        "",
        limit=5,
    )

    assert "Dược Lý" in tags
    assert "Dược Học" not in tags
    assert "Nội Dung Chuyên Ngành" not in tags


def test_fallback_summary_uses_pdf_content_not_catalog_fields() -> None:
    pipeline = AIEtlPipeline.__new__(AIEtlPipeline)

    result = pipeline._fallback_reduce_publication(
        [
            "Supervised learning studies how models infer a mapping from labelled examples and evaluate "
            "generalization on unseen data. The material explains regression, classification, feature "
            "engineering, model validation, overfitting control, and error analysis for practical prediction tasks. "
            "Later sections compare decision trees, linear models, support vector machines, and ensemble methods "
            "through training workflows and experimental evaluation."
        ],
        "Title: Machine Learning cơ bản\nAuthors: Vũ Khắc Tiệp\nCategories: Công Nghệ Thông Tin",
    )

    summary = str(result["master_summary"])

    assert "Machine Learning cơ bản của Vũ Khắc Tiệp" not in summary
    assert "thuộc nhóm" not in summary
    assert "lập chỉ mục" not in summary.lower()
    assert "regression" in summary or "classification" in summary
    assert len(result["tags"]) == 5
    assert result["tags_en"] == align_english_tags(result["tags"])


def test_tag_translations_keep_search_terms_in_english() -> None:
    assert align_english_tags(["Lập Trình Web", "Học Máy"]) == [
        "Web Development",
        "Machine Learning",
    ]
    assert align_english_tags(["Chuẩn Hóa Dữ Liệu"], ["Database Normalization"]) == [
        "Database Normalization",
    ]


def test_catalog_description_can_infer_programming_algorithm_tags() -> None:
    tags = dedupe_quality_tags(
        [
            *GeminiClient._fallback_tags_from_text(
                "The Art of Computer Programming presents programming algorithms and their analysis "
                "for sequential machines by computer scientist Donald Knuth."
            )
        ],
        "",
        limit=5,
    )

    assert "Lập Trình" in tags
    assert "Phân Tích Thuật Toán" in tags
    assert "Thuật Toán" in tags


def test_full_stack_backend_tags_require_web_stack_signals() -> None:
    tags = dedupe_quality_tags(
        GeminiClient._fallback_tags_from_text(
            "Full-stack web development course using React, Redux, Node.js, MongoDB, TypeScript, GraphQL and REST API."
        ),
        "",
        limit=5,
    )

    assert "Phát Triển Full Stack" in tags
    assert "Lập Trình Backend" in tags
    assert "API Web" in tags
    assert "Khoa Học Máy Tính" not in tags


def test_gutenberg_boilerplate_is_removed_before_ai_reduce() -> None:
    raw_text = (
        "*** START OF THE PROJECT GUTENBERG EBOOK PRIDE AND PREJUDICE *** "
        "This header should be the first thing seen when viewing this Project Gutenberg file. "
        "Please read the legal small print and donation information. "
        "Chapter 1 It is a truth universally acknowledged, that a single man in possession "
        "of a good fortune, must be in want of a wife. "
        "*** END OF THE PROJECT GUTENBERG EBOOK PRIDE AND PREJUDICE *** "
        "Project Gutenberg License"
    )

    cleaned = strip_public_domain_boilerplate(raw_text)

    assert "legal small print" not in cleaned.lower()
    assert "donation" not in cleaned.lower()
    assert "Project Gutenberg License" not in cleaned
    assert "It is a truth universally acknowledged" in cleaned


def test_generic_trademark_boilerplate_is_removed_without_title_specific_rules() -> None:
    raw_text = (
        "This does not in any way imply that the foundation endorses this work. "
        "Core Classics and trade names are trademarks and are shown strictly for illustrative and educational purposes. "
        "The story follows a scientist whose experiment creates a living being and raises questions about responsibility."
    )

    cleaned = strip_legal_and_publisher_boilerplate(raw_text)

    assert "endorses this work" not in cleaned.lower()
    assert "trademarks" not in cleaned.lower()
    assert "illustrative and educational purposes" not in cleaned.lower()
    assert "experiment creates a living being" in cleaned


def test_literature_fallback_does_not_generate_engineering_metadata() -> None:
    pipeline = AIEtlPipeline.__new__(AIEtlPipeline)

    result = pipeline._fallback_reduce_publication(
        [
            "The novel follows a family whose daughters face courtship, marriage expectations, social class "
            "pressure and changing first impressions. Several scenes use dialogue and manners to reveal pride, "
            "prejudice, affection, reputation and the limits placed on women in domestic life."
        ],
        "Title: Classic English Novel\nAuthors: N/A\nCategories: English, Courtship",
    )

    summary = str(result["master_summary"])

    assert "Project Gutenberg" not in summary
    assert "legal small print" not in summary.lower()
    assert "Khoa Khoa học và Kỹ thuật Máy tính" not in str(result["audience"])
    assert result["audience"] == "TOAN_BO_SINH_VIEN_BKU"
    assert set(result["tags"]) == {
        "Văn Học Anh",
        "Tiểu Thuyết",
        "Lãng Mạn",
        "Châm Biếm Xã Hội",
        "Quan Hệ Gia Đình",
    }
    assert "Ứng Dụng Thực Tế" not in result["tags"]


def test_fallback_summary_translates_english_medical_memoir_excerpt_to_vietnamese() -> None:
    pipeline = AIEtlPipeline.__new__(AIEtlPipeline)

    result = pipeline._fallback_reduce_publication(
        [
            "When Breath Becomes Air describes medical cases, patients, physicians, diagnoses, treatment, "
            "family relationships, friendship and changes made to names and identifying details. "
            "The memoir reflects on life, death, illness and the human side of clinical care."
        ],
        "Title: When Breath Becomes Air\nAuthors: Paul Kalanithi\nCategories: Biography & Autobiography",
    )

    summary = str(result["master_summary"])

    assert "When Breath Becomes Air describes" not in summary
    assert "patients, physicians" not in summary
    assert "bệnh nhân" in summary or "y khoa" in summary
    assert "sự sống" in summary or "cái chết" in summary
