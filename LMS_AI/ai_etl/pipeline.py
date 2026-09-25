from __future__ import annotations

import hashlib
import math
import re
import unicodedata
from pathlib import Path
from typing import Union

import numpy as np
from psycopg2.extensions import connection as PGConnection

from .config import Settings
from .db import Database
from .embedding_client import EmbeddingClient
from .llm_client import GeminiClient, LLMResponseError
from .pdf_processing import (
    Chunk,
    clean_ocr_artifacts,
    extract_pdf_text,
    sliding_window_chunk,
    strip_legal_and_publisher_boilerplate,
    strip_public_domain_boilerplate,
)
from .tag_quality import align_english_tags, dedupe_quality_tags, suggest_tags_from_text


class AIEtlPipeline:
    def __init__(
        self,
        settings: Settings,
        database: Database,
        llm_client: GeminiClient,
        embedding_client: EmbeddingClient,
    ) -> None:
        self.settings = settings
        self.database = database
        self.llm_client = llm_client
        self.embedding_client = embedding_client

    def run(
        self,
        publication_id: int,
        pdf_path: Union[Path, str],
        conn: PGConnection | None = None,
        force_reprocess: bool = False,
    ) -> dict[str, object]:
        file_hash = self._calculate_file_hash(pdf_path)
        if conn is not None:
            return self._run_with_connection(conn, publication_id, pdf_path, file_hash, force_reprocess)

        with self.database.connect() as conn:
            return self._run_with_connection(conn, publication_id, pdf_path, file_hash, force_reprocess)

    def _run_with_connection(
        self,
        conn: PGConnection,
        publication_id: int,
        pdf_path: Union[Path, str],
        file_hash: str,
        force_reprocess: bool = False,
    ) -> dict[str, object]:
        self.database.ensure_etl_metadata_table(conn)
        self.database.mark_publication_etl_running(conn, publication_id, file_hash)
        conn.commit()

        try:
            full_text = extract_pdf_text(
                pdf_path,
                enable_ocr_fallback=self.settings.enable_ocr_fallback,
                ocr_max_pages=self.settings.ocr_max_pages,
                ocr_dpi=self.settings.ocr_dpi,
                ocr_language=self.settings.ocr_language,
                ocr_min_text_chars=self.settings.ocr_min_text_chars,
            )
            chunks = sliding_window_chunk(
                text=full_text,
                chunk_size=self.settings.chunk_size,
                overlap=self.settings.chunk_overlap,
            )
            if not chunks:
                raise ValueError(
                    "PDF has no usable extractable text. If this is a scanned/image-only PDF, "
                    "OCR did not produce enough reliable text; upload a text-based PDF or improve OCR quality."
                )

            if self.settings.enable_hash_skip and not force_reprocess:
                existing_hash = self.database.get_publication_file_hash(conn, publication_id)
                has_outputs = self.database.publication_has_ai_outputs(conn, publication_id)
                if existing_hash == file_hash and has_outputs:
                    self.database.upsert_publication_file_hash(
                        conn,
                        publication_id,
                        file_hash,
                        chunks_count=len(chunks),
                        vectors_count=0,
                    )
                    conn.commit()
                    return {
                        "publication_id": publication_id,
                        "chunks": len(chunks),
                        "vectors": 0,
                        "skipped": True,
                        "skip_reason": "file_hash_unchanged",
                    }
        except Exception as exc:
            conn.rollback()
            self.database.mark_publication_etl_failed(conn, publication_id, file_hash, str(exc))
            conn.commit()
            raise

        self.database.clear_previous_ai_data(conn, publication_id)
        conn.commit()

        try:
            chunk_texts = [chunk.text for chunk in chunks]
            vectors = self.embedding_client.encode(chunk_texts)

            vector_rows = list(zip(chunk_texts, vectors))
            for batch_rows in self._iter_batches(vector_rows, self.settings.vector_insert_batch_size):
                self.database.bulk_insert_vectors(conn, publication_id, batch_rows)
            conn.commit()
        except Exception:
            conn.rollback()
            raise

        try:
            representative_chunks = self._select_representative_chunks(
                chunks=chunks,
                vectors=vectors,
                max_chunks=self.settings.reduce_max_chunks,
            )
            reduce_inputs = self._apply_reduce_budget(representative_chunks)
            if not reduce_inputs:
                raise ValueError("No representative chunks available for reduce phase")

            publication_context = self.database.get_publication_context(conn, publication_id)
            reduce_result = self._reduce_with_fallback(reduce_inputs, publication_context)
        except Exception as exc:
            conn.rollback()
            self.database.mark_publication_etl_failed(conn, publication_id, file_hash, str(exc))
            conn.commit()
            raise

        try:
            self.database.update_publication_summary(
                conn,
                publication_id,
                reduce_result["master_summary"],
                reduce_result["audience"],
            )

            tag_ids = [
                self.database.find_or_create_tag_id(conn, tag_name)
                for tag_name in reduce_result["tags"]
            ]
            self.database.insert_publication_tag_links(conn, publication_id, tag_ids)
            self.database.upsert_tag_translations(
                conn,
                tag_ids=tag_ids,
                translated_names=align_english_tags(
                    [str(tag) for tag in reduce_result["tags"]],
                    [str(tag) for tag in reduce_result.get("tags_en", [])],
                ),
                language_code="en",
            )
            translation_generated = False
            if self.settings.enable_english_translation:
                translation_generated = self._try_upsert_english_metadata(
                    conn,
                    publication_id,
                    publication_context,
                    str(reduce_result["master_summary"]),
                    [str(tag) for tag in reduce_result["tags"]],
                    tag_ids,
                )
            self.database.upsert_publication_file_hash(
                conn,
                publication_id,
                file_hash,
                chunks_count=len(chunks),
                vectors_count=len(vectors),
                error_message=reduce_result.get("fallback_reason"),
            )
            conn.commit()
        except Exception:
            conn.rollback()
            raise

        return {
            "publication_id": publication_id,
            "chunks": len(chunks),
            "vectors": len(vectors),
            "reduce_inputs": len(reduce_inputs),
            "skipped": False,
            "master_summary": reduce_result["master_summary"],
            "audience": reduce_result["audience"],
            "tags": reduce_result["tags"],
            "translation_generated": translation_generated,
            "metadata_fallback_used": bool(reduce_result.get("fallback_used")),
            "metadata_fallback_reason": reduce_result.get("fallback_reason"),
        }

    def _try_upsert_english_metadata(
        self,
        conn: PGConnection,
        publication_id: int,
        publication_context: str,
        ai_summary_vi: str,
        tags: list[str],
        tag_ids: list[int],
    ) -> bool:
        try:
            translation = self.llm_client.translate_catalog_metadata(
                publication_context=publication_context,
                ai_summary_vi=ai_summary_vi,
                tags=tags,
            )
            self.database.upsert_publication_translation(
                conn,
                publication_id=publication_id,
                language_code="en",
                title=translation.get("title"),
                subtitle=translation.get("subtitle"),
                description=translation.get("description"),
                ai_summary=translation.get("ai_summary"),
            )
            self.database.upsert_tag_translations(
                conn,
                tag_ids=tag_ids,
                translated_names=translation.get("tags", []),
                language_code="en",
            )
            return True
        except Exception:
            return False

    def _reduce_with_fallback(
        self,
        reduce_inputs: list[str],
        publication_context: str = "",
    ) -> dict[str, object]:
        allow_fallback = bool(getattr(self.settings, "allow_metadata_fallback", False))
        try:
            result = self.llm_client.reduce_publication(reduce_inputs, publication_context)
            summary = str(result.get("master_summary") or "")
            if self._looks_like_catalog_or_low_value_summary(summary):
                reason = "Gemini metadata generation returned a low-value or catalog-only summary"
                if allow_fallback:
                    return self._fallback_reduce_publication(reduce_inputs, publication_context, reason)
                raise LLMResponseError(reason)
            if self._is_literature_context(publication_context) and self._has_technical_generic_tags(result.get("tags", [])):
                reason = "Gemini metadata generation returned tags inconsistent with the catalog context"
                if allow_fallback:
                    return self._fallback_reduce_publication(reduce_inputs, publication_context, reason)
                raise LLMResponseError(reason)
            return result
        except Exception as exc:
            if not allow_fallback:
                raise LLMResponseError(
                    "Gemini metadata generation failed and AI_ETL_ALLOW_METADATA_FALLBACK is disabled. "
                    f"Original error: {exc}"
                ) from exc
            return self._fallback_reduce_publication(
                reduce_inputs,
                publication_context,
                f"Gemini metadata generation failed; used deterministic fallback. Original error: {exc}",
            )

    def _fallback_reduce_publication(
        self,
        reduce_inputs: list[str],
        publication_context: str = "",
        reason: str | None = None,
    ) -> dict[str, object]:
        context = self._parse_publication_context(publication_context)
        joined_text = self._clean_summary_source(" ".join(reduce_inputs))
        if not self._has_content_worth_summarizing([joined_text]):
            result = self._catalog_context_reduce_publication(publication_context)
            if reason:
                result["fallback_used"] = True
                result["fallback_reason"] = reason
            return result

        fallback_tags = self._extract_fallback_tags(joined_text, context, publication_context)
        summary = self._fallback_overview_summary(context, fallback_tags, joined_text)
        audience = self._infer_faculty(" ".join([joined_text, publication_context]))
        if self._is_literature_context(publication_context):
            audience = "TOAN_BO_SINH_VIEN_BKU"

        return {
            "master_summary": summary,
            "audience": audience,
            "tags": fallback_tags,
            "tags_en": align_english_tags(fallback_tags),
            "fallback_used": bool(reason),
            "fallback_reason": reason,
        }

    def _catalog_context_reduce_publication(self, publication_context: str = "") -> dict[str, object]:
        context = self._parse_publication_context(publication_context)
        title = context.get("title", "Tài liệu")
        description = context.get("description", "")
        categories = context.get("categories", "")
        summary_source = " ".join(part for part in (description, categories, title) if part)
        tags = self._extract_fallback_tags(summary_source, context, publication_context)
        audience = self._infer_faculty(summary_source)
        if self._is_literature_context(publication_context):
            audience = "TOAN_BO_SINH_VIEN_BKU"

        if description:
            summary = (
                f"Tài liệu này tập trung vào {description.rstrip('.')}."
                " Nội dung phù hợp để người đọc nhận diện nhanh phạm vi chủ đề, công nghệ hoặc kỹ năng chính "
                "trước khi mở tài liệu. Với tài liệu này, mô tả biên mục là nguồn đáng tin cậy nhất hiện có "
                "để tóm lược mục tiêu học tập."
            )
        else:
            summary = (
                f"Tài liệu {title} chưa có đủ nội dung văn bản trích xuất đáng tin cậy để tạo tóm tắt chi tiết. "
                "Hệ thống chỉ xác định được thông tin biên mục và nhóm chủ đề ban đầu, nên người đọc nên mở "
                "file trực tiếp để đánh giá nội dung trước khi sử dụng."
            )

        return {
            "master_summary": self._normalize_summary(summary),
            "audience": audience,
            "tags": tags,
            "tags_en": align_english_tags(tags),
        }

    def _fallback_overview_summary(
        self,
        context: dict[str, str],
        tags: list[str],
        content_text: str,
    ) -> str:
        description = context.get("description", "")
        categories = context.get("categories", "")
        tag_text = ", ".join(tags[:4]) if tags else categories or "các chủ đề chính của tài liệu"
        source = " ".join([description, categories, content_text])
        faculty = self._infer_faculty(source)
        extractive_summary = self._extractive_content_summary(content_text)

        if self._is_literature_context(" ".join(context.values()) + " " + content_text):
            title = context.get("title", "").strip() or "Tác phẩm"
            if extractive_summary:
                localized = self._fallback_content_overview_vi(
                    fallback_tags=tags,
                    extractive_summary=extractive_summary,
                )
                if localized:
                    return localized
                return self._generic_vietnamese_summary_from_tags(
                    title=title,
                    tag_text=tag_text,
                    source_text=content_text,
                )
            return self._normalize_summary(
                f"{title} là một văn bản văn học cần được đọc qua nhân vật, bối cảnh xã hội, giọng kể và các "
                "xung đột cảm xúc được triển khai trong tác phẩm. Nội dung trích xuất hiện chưa đủ ổn định để "
                "tạo bản tóm tắt sâu hơn mà không có nguy cơ suy diễn."
            )

        used_structured_fallback_summary = False
        if extractive_summary:
            base = self._fallback_content_overview_vi(
                fallback_tags=tags,
                extractive_summary=extractive_summary,
            )
            if base:
                used_structured_fallback_summary = True
            else:
                base = self._generic_vietnamese_summary_from_tags(
                    title=context.get("title", "").strip() or "Tài liệu",
                    tag_text=tag_text,
                    source_text=content_text,
                )
                used_structured_fallback_summary = True
        elif description:
            description = self._localize_known_description(description.rstrip("."))
            if self._normalize_text(description).startswith(("tai lieu", "khoa hoc", "giao trinh", "sach")):
                base = f"{description}."
            else:
                base = f"{description}."
        else:
            base = (
                f"Tài liệu xoay quanh các chủ đề nổi bật như {tag_text}, với trọng tâm là các khái niệm và kỹ năng "
                "cốt lõi mà người đọc cần nắm khi tiếp cận lĩnh vực này."
            )

        if used_structured_fallback_summary:
            tail = ""
        elif faculty == "KHOA_QUAN_LY_CONG_NGHIEP":
            tail = (
                " Nội dung có giá trị về quản lý, giao tiếp, ra quyết định hoặc làm việc với con "
                "người trong bối cảnh thực tế."
            )
        elif faculty == "KHOA_DIEN_DIEN_TU":
            tail = (
                " Nội dung liên quan đến nguyên lý kỹ thuật, thành phần hệ thống, đo "
                "lường hoặc thiết kế trong lĩnh vực điện, điện tử và cơ điện tử."
            )
        else:
            tail = (
                f" Nội dung giúp người đọc nhận diện rõ mối liên hệ với {tag_text} và định hướng những phần nên đọc sâu hơn."
            )

        return self._normalize_summary(base + tail)

    @classmethod
    def _fallback_content_overview_vi(cls, fallback_tags: list[str], extractive_summary: str) -> str:
        if cls._looks_vietnamese(extractive_summary):
            return ""

        normalized = cls._normalize_text(extractive_summary)
        points: list[str] = []
        if any(term in normalized for term in ("patient", "medical", "physician", "diagnos", "treating", "treatment")):
            points.append(
                "trải nghiệm y khoa, quan hệ giữa bác sĩ và bệnh nhân, cũng như cách bệnh tật làm thay đổi đời sống con người"
            )
        if any(term in normalized for term in ("memoir", "autobiography", "biography", "life", "death", "family", "relationship")):
            points.append(
                "chất tự truyện, suy tư về sự sống, cái chết, gia đình và các mối quan hệ cá nhân"
            )
        if any(term in normalized for term in ("novel", "fiction", "character", "social", "conflict", "romance")):
            points.append(
                "nhân vật, xung đột xã hội, cảm xúc cá nhân và cách câu chuyện phản ánh bối cảnh sống của con người"
            )
        if "supervised learning" in normalized or "regression" in normalized or "classification" in normalized:
            points.append(
                "học có giám sát, regression, classification và cách đánh giá khả năng khái quát hóa của mô hình"
            )
        if "feature engineering" in normalized or "model validation" in normalized or "overfitting" in normalized:
            points.append(
                "kỹ thuật đặc trưng, đánh giá mô hình, kiểm soát overfitting và phân tích lỗi trong quy trình dự đoán"
            )
        if "program" in normalized and "digital computer" in normalized:
            points.append(
                "quá trình chuẩn bị chương trình cho máy tính số, bao gồm cách diễn đạt lời giải đủ rõ để máy tính có thể thực thi"
            )
        if "stored program" in normalized or "instructions" in normalized:
            points.append(
                "mô hình máy tính lưu chương trình, nơi lệnh được giữ trong bộ nhớ và thực hiện tuần tự"
            )
        if "algorithm" in normalized:
            points.append("thuật toán, phân tích thuật toán và các kỹ thuật lập trình nền tảng")
        if "reference" in normalized or "self study" in normalized or "college course" in normalized:
            points.append("vai trò của tài liệu như sách tham khảo, giáo trình tự học hoặc tài liệu cho học phần đại học")
        if "exercise" in normalized:
            points.append("hệ thống bài tập giúp người đọc luyện kỹ năng và kiểm tra mức độ hiểu nội dung")

        if not points:
            return ""

        tag_text = ", ".join(fallback_tags[:4]) if fallback_tags else "các chủ đề lập trình và khoa học máy tính"
        sentences = [f"Tài liệu tập trung vào {points[0]}."]
        if len(points) >= 3:
            sentences.append(f"Nội dung cũng đề cập đến {points[1]} và {points[2]}.")
            remaining = points[3:]
        elif len(points) == 2:
            sentences.append(f"Nội dung cũng đề cập đến {points[1]}.")
            remaining = []
        else:
            sentences.append(f"Các chủ đề nổi bật có liên hệ với {tag_text}.")
            remaining = []

        if remaining:
            sentences.append(f"Ngoài phần lý thuyết, tài liệu còn thể hiện {remaining[0]}.")
        else:
            sentences.append(f"Tài liệu phù hợp với người đọc đã có nền tảng nhất định và muốn học sâu hơn về {tag_text}.")
        return cls._normalize_summary(" ".join(sentences))

    @classmethod
    def _generic_vietnamese_summary_from_tags(cls, title: str, tag_text: str, source_text: str) -> str:
        normalized = cls._normalize_text(source_text)
        if any(term in normalized for term in ("patient", "medical", "physician", "diagnos", "treatment")):
            focus = (
                "các trải nghiệm liên quan đến y khoa, bệnh nhân, chẩn đoán, điều trị và tác động của bệnh tật "
                "đến đời sống cá nhân"
            )
        elif any(term in normalized for term in ("novel", "fiction", "character", "romance", "social")):
            focus = "nhân vật, quan hệ xã hội, xung đột cảm xúc và bối cảnh sống được triển khai trong tác phẩm"
        elif any(term in normalized for term in ("algorithm", "program", "computer", "data", "model")):
            focus = "các khái niệm kỹ thuật, quy trình giải quyết vấn đề và nền tảng chuyên môn liên quan"
        else:
            focus = f"các chủ đề chính như {tag_text}"

        return cls._normalize_summary(
            f"{title} tập trung vào {focus}. "
            "Phần nội dung được diễn đạt lại bằng tiếng Việt theo hướng ngắn gọn, giúp người đọc nhanh chóng nắm phạm vi kiến thức, "
            "mức độ chuyên môn và giá trị sử dụng của tài liệu trước khi mượn hoặc đọc sâu hơn."
        )

    @classmethod
    def _is_literature_context(cls, text: str) -> bool:
        normalized = cls._normalize_text(text)
        literature_terms = (
            "courtship",
            "english literature",
            "fiction",
            "novel",
            "romance",
            "van hoc",
            "tieu thuyet",
            "lang man",
            "hon nhan",
        )
        return any(term in normalized for term in literature_terms)

    @staticmethod
    def _has_technical_generic_tags(tags: object) -> bool:
        if not isinstance(tags, list):
            return False
        normalized_tags = {
            AIEtlPipeline._normalize_text(str(tag))
            for tag in tags
        }
        generic_technical = {
            "noi dung chuyen nganh",
            "kien thuc nen tang",
            "phuong phap thuc hanh",
            "ung dung thuc te",
            "bai toan chuyen nganh",
            "tu duy ky thuat",
            "tu duy phan tich",
        }
        return len(normalized_tags.intersection(generic_technical)) >= 2

    @staticmethod
    def _localize_known_description(description: str) -> str:
        normalized = description.strip().lower()
        known = {
            "provides suggestions for successfully dealing with people both in social and business situations":
                "Tài liệu đưa ra các gợi ý thực tế để giao tiếp và ứng xử hiệu quả với con người trong bối cảnh xã hội cũng như kinh doanh",
        }
        return known.get(normalized, description)

    @staticmethod
    def _clean_summary_source(text: str) -> str:
        text = clean_ocr_artifacts(text)
        text = strip_legal_and_publisher_boilerplate(strip_public_domain_boilerplate(text))
        text = re.sub(
            r"(?i)\b(publication id|title|subtitle|language|publication year|authors|categories|tags|ai summary)\s*:[^.!?\n]*(?:[.!?]\s*)?",
            " ",
            text,
        )
        text = re.sub(r"(?i)\b(description):", " ", text)
        text = re.sub(r"\.{4,}", " ", text)
        text = re.sub(r"\b\d+\s*/\s*\d+\b", " ", text)
        text = re.sub(r"\bpage\s+\d+\b", " ", text, flags=re.IGNORECASE)
        text = re.sub(r"\s+", " ", text).strip()
        sentences = re.split(r"(?<=[.!?])\s+", text)
        useful = []
        noise_terms = (
            "addison-wesley",
            "cataloging-in-publication",
            "contents",
            "table of contents",
            "references",
            "bibliography",
            "copyright",
            "project gutenberg",
            "legal small print",
            "donation",
            "trademark",
            "trade names",
            "endorses this work",
            "illustrative and educational purposes",
            "all rights reserved",
            "isbn",
            "preface",
            "acknowledg",
            "license",
            "printed in",
            "published simultaneously",
            "isbn",
            "cookbook",
            "http://",
            "https://",
        )
        for sentence in sentences:
            lowered = sentence.lower()
            symbol_ratio = sum(1 for ch in sentence if ch in "=∑∫√≤≥<>|{}[]") / max(len(sentence), 1)
            digit_ratio = sum(ch.isdigit() for ch in sentence) / max(len(sentence), 1)
            if len(sentence) < 40 or any(term in lowered for term in noise_terms):
                continue
            if symbol_ratio > 0.06:
                continue
            if digit_ratio > 0.18:
                continue
            useful.append(sentence)
        return " ".join(useful[:10]) or text

    @staticmethod
    def _extractive_content_summary(text: str) -> str:
        text = clean_ocr_artifacts(text)
        sentences = re.split(r"(?<=[.!?])\s+", text)
        blocked_terms = (
            "title:",
            "subtitle:",
            "description:",
            "authors:",
            "categories:",
            "copyright",
            "project gutenberg",
            "legal small print",
            "donation",
            "trademark",
            "trade names",
            "endorses this work",
            "illustrative and educational purposes",
            "references",
            "bibliography",
            "table of contents",
            "contents",
            "addison-wesley",
            "cataloging-in-publication",
            "cip",
            "qa76",
            "printed in",
            "published simultaneously",
            "mccall's cookbook",
            "cookbook",
            "http://",
            "https://",
        )
        candidates: list[str] = []
        for sentence in sentences:
            clean = re.sub(r"\s+", " ", sentence).strip()
            lowered = clean.lower()
            if len(clean) < 70 or len(clean) > 360:
                continue
            if any(term in lowered for term in blocked_terms):
                continue
            alpha_ratio = sum(ch.isalpha() for ch in clean) / max(len(clean), 1)
            symbol_ratio = sum(1 for ch in clean if ch in "=∑∫√≤≥<>|{}[]") / max(len(clean), 1)
            digit_ratio = sum(ch.isdigit() for ch in clean) / max(len(clean), 1)
            if alpha_ratio < 0.55 or symbol_ratio > 0.04 or digit_ratio > 0.18:
                continue
            candidates.append(clean)
            if len(candidates) >= 5:
                break

        if not candidates:
            return ""

        summary = " ".join(candidates)
        if len(summary) > 950:
            summary = summary[:950].rsplit(" ", 1)[0].rstrip(" .,;:") + "."
        return summary

    @staticmethod
    def _normalize_summary(text: str) -> str:
        return re.sub(r"\s+", " ", text).strip()

    @staticmethod
    def _looks_vietnamese(text: str) -> bool:
        normalized = AIEtlPipeline._normalize_text(text)
        vietnamese_terms = ("tai lieu", "noi dung", "nguoi doc", "chuong", "kien thuc", "phuong phap")
        return sum(term in normalized for term in vietnamese_terms) >= 2

    @classmethod
    def _looks_like_catalog_or_low_value_summary(cls, summary: str) -> bool:
        lowered = summary.lower()
        blocked = (
            "publication id:",
            "language:",
            "publication year:",
            "authors:",
            "categories:",
            "tags:",
            "ai summary:",
            "metadata",
            "lập chỉ mục",
            "file pdf",
            "hệ thống ai",
            "đoạn ocr",
            "các đoạn ocr",
            "nguồn là ocr",
            "pdf dạng ảnh",
            "tránh suy diễn",
            "chỉ sử dụng những ý đọc được",
        )
        if any(term in lowered for term in blocked):
            return True

        normalized = cls._normalize_summary(summary)
        sentences = [sentence for sentence in re.split(r"(?<=[.!?])\s+", normalized) if sentence.strip()]
        if len(normalized) < 220 or len(sentences) < 3:
            return True

        generic_phrases = (
            "cung cấp kiến thức tổng quan",
            "giúp người đọc hiểu rõ hơn",
            "nhiều khía cạnh khác nhau",
            "các chủ đề liên quan",
            "nội dung phong phú",
            "kiến thức nền tảng",
            "ứng dụng thực tế",
        )
        return sum(phrase in lowered for phrase in generic_phrases) >= 3

    @classmethod
    def _has_content_worth_summarizing(cls, texts: list[str]) -> bool:
        cleaned = cls._normalize_summary(" ".join(texts))
        if len(cleaned) < 100:
            return False

        lowered = cleaned.lower()
        metadata_hits = sum(
            term in lowered
            for term in (
                "publication id:",
                "title:",
                "language:",
                "publication year:",
                "authors:",
                "categories:",
                "tags:",
                "description:",
                "ai summary:",
            )
        )
        if metadata_hits >= 2:
            return False

        front_matter_hits = sum(
            term in lowered
            for term in (
                "copyright",
                "project gutenberg",
                "legal small print",
                "donation",
                "trademark",
                "trade names",
                "endorses this work",
                "illustrative and educational purposes",
                "all rights reserved",
                "isbn",
                "table of contents",
                "contents",
                "preface",
                "acknowledg",
                "license",
            )
        )
        if front_matter_hits >= 3:
            return False

        alpha_ratio = sum(ch.isalpha() for ch in cleaned) / max(len(cleaned), 1)
        return alpha_ratio >= 0.55

    @staticmethod
    def _parse_publication_context(text: str) -> dict[str, str]:
        context: dict[str, str] = {}
        for line in text.splitlines():
            if ":" not in line:
                continue
            key, value = line.split(":", 1)
            key = key.strip().lower()
            value = value.strip()
            if value:
                context[key] = value
        return context

    @staticmethod
    def _normalize_text(text: str) -> str:
        normalized = unicodedata.normalize("NFD", text.lower())
        without_marks = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
        return without_marks.replace("đ", "d")

    def _infer_faculty(self, text: str) -> str:
        normalized = self._normalize_text(text)
        if self._is_literature_context(text):
            return "TOAN_BO_SINH_VIEN_BKU"
        keyword_map = [
            ("KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH", ("computer", "software", "algorithm", "data", "program", "code", "lap trinh", "thuat toan", "co so du lieu", "cong nghe thong tin", "machine learning", "hoc may", "supervised", "regression", "classification")),
            ("KHOA_DIEN_DIEN_TU", ("dien", "dien tu", "circuit", "electronics", "signal")),
            ("KHOA_CO_KHI", ("co khi", "mechanical", "manufacturing")),
            ("KHOA_KY_THUAT_HOA_HOC", ("hoa hoc", "chemical", "chemistry")),
            ("KHOA_KY_THUAT_XAY_DUNG", ("xay dung", "construction", "civil")),
            ("KHOA_KY_THUAT_GIAO_THONG", ("giao thong", "transport", "traffic")),
            ("KHOA_QUAN_LY_CONG_NGHIEP", ("quan ly", "management", "industrial", "business", "economics", "leadership", "people skills")),
            ("KHOA_MOI_TRUONG_VA_TAI_NGUYEN", ("moi truong", "environment", "resource")),
            ("KHOA_CONG_NGHE_VAT_LIEU", ("vat lieu", "material")),
            ("KHOA_KHOA_HOC_UNG_DUNG", ("toan", "physics", "applied", "ung dung")),
            ("KHOA_KY_THUAT_DIA_CHAT_VA_DAU_KHI", ("dia chat", "dau khi", "geology", "petroleum")),
        ]
        for faculty, keywords in keyword_map:
            if any(keyword in normalized for keyword in keywords):
                return faculty
        return "TOAN_BO_SINH_VIEN_BKU"

    def _extract_fallback_tags(
        self,
        text: str,
        context: dict[str, str] | None = None,
        publication_context: str = "",
    ) -> list[str]:
        context = context or {}
        source = " ".join([
            context.get("title", ""),
            context.get("subtitle", ""),
            context.get("description", ""),
            context.get("categories", ""),
            text,
        ])
        tags = suggest_tags_from_text(source, publication_context, limit=5)
        if len(tags) >= 5:
            return tags[:5]

        if self._is_literature_context(source):
            backfill = dedupe_quality_tags(
                [
                    "Văn Học Anh",
                    "Tiểu Thuyết",
                    "Sách Khai Phóng",
                    "Lãng Mạn",
                    "Kinh Dị Gothic",
                    "Khoa Học Viễn Tưởng",
                    "Châm Biếm Xã Hội",
                    "Quan Hệ Gia Đình",
                ],
                publication_context,
                limit=5,
            )
            for tag in backfill:
                if len(tags) >= 5:
                    break
                if tag.lower() not in {existing.lower() for existing in tags}:
                    tags.append(tag)
            return tags[:5]

        return tags[:5]

    @staticmethod
    def _calculate_file_hash(pdf_source: Union[Path, str]) -> str:
        """Calculate hash of PDF file or URL content.

        For URLs, hash the URL string itself for efficiency (don't download twice).
        For local files, hash the file content.
        """
        digest = hashlib.sha256()

        if isinstance(pdf_source, str) and (pdf_source.startswith('http://') or pdf_source.startswith('https://')):
            # Hash the URL string for remote files (efficient, avoids re-downloading)
            digest.update(pdf_source.encode('utf-8'))
        else:
            # Hash file content for local files
            pdf_path = Path(pdf_source) if isinstance(pdf_source, str) else pdf_source
            with pdf_path.open("rb") as file_obj:
                for block in iter(lambda: file_obj.read(1024 * 1024), b""):
                    digest.update(block)

        return digest.hexdigest()

    def _select_representative_chunks(
        self,
        chunks: list[Chunk],
        vectors: list[list[float]],
        max_chunks: int,
    ) -> list[str]:
        if not chunks:
            return []

        scored_candidates = [
            (index, self._summary_source_quality_score(self._clean_summary_source(chunk.text)))
            for index, chunk in enumerate(chunks)
        ]
        eligible_indices = [
            index for index, score in scored_candidates
            if score >= 45 and self._has_content_worth_summarizing([self._clean_summary_source(chunks[index].text)])
        ]
        if len(eligible_indices) < min(3, len(chunks)):
            eligible_indices = [
                index for index, score in scored_candidates
                if score >= 30 and self._has_content_worth_summarizing([self._clean_summary_source(chunks[index].text)])
            ]
        target_floor = min(max(1, max_chunks), len(chunks))
        if len(eligible_indices) >= target_floor:
            chunks = [chunks[index] for index in eligible_indices]
            vectors = [vectors[index] for index in eligible_indices]
            quality_scores = np.array([score for _index, score in scored_candidates if _index in set(eligible_indices)], dtype=np.float32)
        else:
            quality_scores = np.array([score for _index, score in scored_candidates], dtype=np.float32)

        embeddings = np.array(vectors, dtype=np.float32)
        if embeddings.ndim != 2 or embeddings.shape[0] != len(chunks):
            ranked = sorted(range(len(chunks)), key=lambda idx: float(quality_scores[idx]) if idx < len(quality_scores) else 0.0, reverse=True)
            selected = sorted(ranked[: min(max_chunks, len(ranked))])
            return [chunks[idx].text for idx in selected]

        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        embeddings = np.divide(
            embeddings,
            np.maximum(norms, 1e-12),
            out=np.zeros_like(embeddings),
            where=norms > 0,
        )
        total_chunks = len(chunks)
        target = min(max_chunks, max(8, int(math.sqrt(total_chunks) * 2)), total_chunks)

        centroid = embeddings.mean(axis=0)
        centroid_norm = np.linalg.norm(centroid)
        if centroid_norm == 0:
            return [chunk.text for chunk in chunks[:target]]
        centroid = centroid / centroid_norm

        similarities = embeddings @ centroid
        selected: list[int] = []

        if len(quality_scores) and float(np.max(quality_scores)) <= 0.0:
            if total_chunks > 0:
                selected.append(0)
            if total_chunks > 1 and len(selected) < target:
                selected.append(1)
            centroid_idx = int(np.argmax(similarities))
            if centroid_idx not in selected and len(selected) < target:
                selected.append(centroid_idx)
            candidate_indices = set(range(total_chunks))
            candidate_indices.difference_update(selected)
            while len(selected) < target and candidate_indices:
                best_idx = max(candidate_indices, key=lambda idx: float(similarities[idx]))
                selected.append(best_idx)
                candidate_indices.remove(best_idx)
            selected.sort()
            return [chunks[idx].text for idx in selected]

        if total_chunks > 0:
            opening_window = range(min(12, total_chunks))
            opening_idx = max(
                opening_window,
                key=lambda idx: (float(quality_scores[idx]) if idx < len(quality_scores) else 0.0, float(similarities[idx])),
            )
            selected.append(opening_idx)

        if len(selected) < target and total_chunks > 1:
            quality_idx = int(np.argmax(quality_scores)) if len(quality_scores) else 0
            if quality_idx not in selected:
                selected.append(quality_idx)

        centroid_idx = int(np.argmax(similarities))
        if centroid_idx not in selected and len(selected) < target:
            selected.append(centroid_idx)
        candidate_indices = set(range(total_chunks))
        candidate_indices.difference_update(selected)

        lambda_weight = 0.55
        quality_norm = quality_scores / max(float(np.max(quality_scores)), 1.0) if len(quality_scores) else np.zeros(total_chunks)
        while len(selected) < target and candidate_indices:
            best_idx = None
            best_score = float("-inf")

            for idx in candidate_indices:
                relevance = float(similarities[idx])
                diversity_penalty = max(float(embeddings[idx] @ embeddings[s]) for s in selected)
                quality_bonus = float(quality_norm[idx]) if idx < len(quality_norm) else 0.0
                score = lambda_weight * relevance + 0.30 * quality_bonus - 0.15 * diversity_penalty
                if score > best_score:
                    best_score = score
                    best_idx = idx

            if best_idx is None:
                break

            selected.append(best_idx)
            candidate_indices.remove(best_idx)

        selected.sort()
        return [chunks[idx].text for idx in selected]

    @classmethod
    def _summary_source_quality_score(cls, text: str) -> float:
        clean = cls._normalize_summary(text)
        if len(clean) < 120:
            return 0.0

        lowered = clean.lower()
        alpha_ratio = sum(ch.isalpha() for ch in clean) / max(len(clean), 1)
        digit_ratio = sum(ch.isdigit() for ch in clean) / max(len(clean), 1)
        symbol_ratio = sum(1 for ch in clean if ch in "=∑∫√≤≥<>|{}[]") / max(len(clean), 1)
        sentences = [sentence for sentence in re.split(r"(?<=[.!?])\s+", clean) if len(sentence.strip()) >= 45]

        score = 0.0
        score += min(28.0, len(clean) / 55.0)
        score += min(24.0, len(sentences) * 4.0)
        score += max(0.0, (alpha_ratio - 0.50) * 55.0)

        content_terms = (
            "principle", "practice", "design", "method", "technique", "problem", "example",
            "implementation", "architecture", "algorithm", "data", "model", "code", "program",
            "refactor", "test", "function", "class", "object", "module", "system",
            "nguyên lý", "phương pháp", "kỹ thuật", "thiết kế", "ví dụ", "bài toán",
        )
        score += min(18.0, sum(term in lowered for term in content_terms) * 3.0)

        boilerplate_terms = (
            "all rights reserved", "copyright", "isbn", "publisher", "published by",
            "no liability", "warranty", "trademark", "permission", "printed in",
            "cataloging-in-publication", "table of contents", "contents", "chapter ",
            "references", "bibliography", "index", "preface", "acknowledg",
            "release 2002", "doesn’t have money to buy",
        )
        score -= sum(term in lowered for term in boilerplate_terms) * 11.0

        standalone_numbers = re.findall(r"\b\d{1,3}\b", clean)
        chapter_refs = re.findall(r"\bchapter\s+\d+", lowered)
        toc_markers = len(re.findall(r"\bchapter\s+\d+|\b\d{1,3}\s+[A-Z][A-Za-z]+|\b\d{1,3}\s*$", clean))
        score -= min(28.0, toc_markers * 3.5)
        if len(chapter_refs) >= 2:
            score -= 40.0
        if len(standalone_numbers) >= 5:
            score -= 28.0
        if len(chapter_refs) >= 2 and len(standalone_numbers) >= 4:
            score -= 45.0
        if digit_ratio > 0.16:
            score -= 18.0
        if symbol_ratio > 0.04:
            score -= 18.0
        if alpha_ratio < 0.55:
            score -= 18.0

        return max(0.0, min(100.0, score))

    def _apply_reduce_budget(self, texts: list[str]) -> list[str]:
        selected: list[str] = []
        total_chars = 0

        for text in texts:
            clipped = self._clean_summary_source(text)[: self.settings.reduce_max_chars_per_chunk].strip()
            if not clipped:
                continue

            if total_chars + len(clipped) > self.settings.reduce_total_chars_budget:
                break

            selected.append(clipped)
            total_chars += len(clipped)

        return selected

    @staticmethod
    def _iter_batches(items: list, batch_size: int):
        for i in range(0, len(items), batch_size):
            yield items[i : i + batch_size]
