from __future__ import annotations

import json
import random
import re
import threading
import time
from typing import Any

import requests

from .tag_quality import (
    align_english_tags,
    clean_ai_tag,
    dedupe_quality_tags,
    is_low_quality_tag,
    normalize_key,
    suggest_tags_from_text,
)


class LLMResponseError(RuntimeError):
    pass


FACULTY_TARGETS = {
    "TOAN_BO_SINH_VIEN_BKU",
    "KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH",
    "KHOA_DIEN_DIEN_TU",
    "KHOA_CO_KHI",
    "KHOA_KY_THUAT_HOA_HOC",
    "KHOA_KY_THUAT_XAY_DUNG",
    "KHOA_KY_THUAT_GIAO_THONG",
    "KHOA_QUAN_LY_CONG_NGHIEP",
    "KHOA_MOI_TRUONG_VA_TAI_NGUYEN",
    "KHOA_CONG_NGHE_VAT_LIEU",
    "KHOA_KHOA_HOC_UNG_DUNG",
    "KHOA_KY_THUAT_DIA_CHAT_VA_DAU_KHI",
}


class GeminiClient:
    _throttle_lock = threading.Lock()
    _last_request_started_at = 0.0

    def __init__(
        self,
        api_key: str,
        cheap_model: str,
        premium_model: str,
        timeout_seconds: int,
        retry_attempts: int,
        min_request_interval_seconds: float = 1.2,
    ) -> None:
        self.api_key = api_key
        self.cheap_model = cheap_model
        self.premium_model = premium_model
        self.timeout_seconds = timeout_seconds
        self.retry_attempts = retry_attempts
        self.min_request_interval_seconds = max(0.0, float(min_request_interval_seconds))

    def _throttle(self) -> None:
        if self.min_request_interval_seconds <= 0:
            return

        with self._throttle_lock:
            now = time.monotonic()
            elapsed = now - self._last_request_started_at
            wait_seconds = self.min_request_interval_seconds - elapsed
            if wait_seconds > 0:
                time.sleep(wait_seconds)
            self._last_request_started_at = time.monotonic()

    @staticmethod
    def _is_rate_limit_error(exc: Exception) -> bool:
        response = getattr(exc, "response", None)
        if response is not None and getattr(response, "status_code", None) == 429:
            return True
        if isinstance(exc, requests.HTTPError):
            return getattr(getattr(exc, "response", None), "status_code", None) == 429
        return False

    @staticmethod
    def _retry_after_seconds(exc: Exception) -> float | None:
        response = getattr(exc, "response", None)
        if response is None:
            return None

        retry_after = response.headers.get("Retry-After")
        if not retry_after:
            return None

        try:
            return max(0.0, float(retry_after))
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _safe_error_message(exc: Exception | None) -> str:
        if exc is None:
            return "unknown error"

        message = str(exc)
        message = re.sub(r"([?&]key=)[^&\s]+", r"\1<redacted>", message)
        return message

    def _call(self, prompt: str, model: str) -> str:
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent?key={self.api_key}"
        )
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt,
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json",
            },
        }

        last_error: Exception | None = None
        for attempt in range(1, self.retry_attempts + 1):
            try:
                self._throttle()
                response = requests.post(url, json=payload, timeout=self.timeout_seconds)
                response.raise_for_status()
                body = response.json()
                return self._extract_text(body)
            except Exception as exc:
                last_error = exc
                if attempt == self.retry_attempts:
                    break
                # Exponential backoff with jitter to reduce thundering-herd retries.
                backoff = min(60.0, 2 ** (attempt - 1))
                if self._is_rate_limit_error(exc):
                    retry_after = self._retry_after_seconds(exc)
                    if retry_after is not None:
                        backoff = max(backoff, retry_after)
                    else:
                        backoff = max(backoff, 5.0)
                time.sleep(backoff + random.uniform(0.0, 0.5))

        raise LLMResponseError(
            f"LLM API failed after {self.retry_attempts} attempts: {self._safe_error_message(last_error)}"
        )

    @staticmethod
    def _extract_text(body: dict[str, Any]) -> str:
        candidates = body.get("candidates") or []
        if not candidates:
            raise LLMResponseError("LLM response has no candidates")

        parts = (((candidates[0] or {}).get("content") or {}).get("parts") or [])
        if not parts:
            raise LLMResponseError("LLM response has no content parts")

        text = parts[0].get("text")
        if not text:
            raise LLMResponseError("LLM response has empty text")
        return text

    @staticmethod
    def extract_json_payload(raw_text: str) -> Any:
        """Recover JSON if model returns wrapped markdown or extra text."""
        stripped = raw_text.strip()

        if stripped.startswith("```"):
            stripped = re.sub(r"^```(?:json)?", "", stripped)
            stripped = re.sub(r"```$", "", stripped).strip()

        try:
            return json.loads(stripped)
        except json.JSONDecodeError:
            match = re.search(r"(\{.*\}|\[.*\])", stripped, re.DOTALL)
            if not match:
                raise LLMResponseError("Model output is not valid JSON")
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError as exc:
                raise LLMResponseError("Model output JSON is malformed") from exc

    def reduce_publication(
        self,
        representative_chunks: list[str],
        publication_context: str = "",
    ) -> dict[str, Any]:
        models_to_try = [self.cheap_model]
        if self.premium_model and self.premium_model != self.cheap_model:
            models_to_try.append(self.premium_model)

        last_error: Exception | None = None
        for model in models_to_try:
            try:
                return self._reduce_once(model, representative_chunks, publication_context)
            except Exception as exc:
                last_error = exc

        raise LLMResponseError(f"Reduce failed on all model routes: {last_error}")

    def translate_catalog_metadata(
        self,
        publication_context: str,
        ai_summary_vi: str,
        tags: list[str],
    ) -> dict[str, Any]:
        models_to_try = [self.cheap_model]
        if self.premium_model and self.premium_model != self.cheap_model:
            models_to_try.append(self.premium_model)

        last_error: Exception | None = None
        for model in models_to_try:
            try:
                return self._translate_catalog_metadata_once(
                    model,
                    publication_context,
                    ai_summary_vi,
                    tags,
                )
            except Exception as exc:
                last_error = exc

        raise LLMResponseError(f"Translation failed on all model routes: {last_error}")

    def translate_terms(self, terms: list[str], target_language: str = "English") -> list[str]:
        clean_terms = [str(term).strip() for term in terms if str(term).strip()]
        if not clean_terms:
            return []

        prompt = (
            "You are translating academic library category/tag names.\n"
            f"Translate each term to {target_language}. Preserve technical acronyms and proper nouns. "
            "Return exactly one JSON array with the same length and order as the input. "
            "No markdown, no explanation.\n\n"
            f"TERMS:\n{json.dumps(clean_terms, ensure_ascii=False)}"
        )
        raw = self._call(prompt, model=self.cheap_model)
        payload = self.extract_json_payload(raw)
        if not isinstance(payload, list):
            raise LLMResponseError("Term translation response is not a JSON array")
        translated = [str(item).strip()[:150] for item in payload]
        if len(translated) != len(clean_terms):
            raise LLMResponseError("Term translation response length mismatch")
        return translated

    def _translate_catalog_metadata_once(
        self,
        model: str,
        publication_context: str,
        ai_summary_vi: str,
        tags: list[str],
    ) -> dict[str, Any]:
        prompt = (
            "You are a professional academic library metadata translator.\n"
            "Translate the catalogue metadata to English for an English UI. Preserve proper nouns, "
            "book titles that are already English, author names, ISBN-like tokens, technical terms, "
            "and code/library names. Do not add facts.\n"
            "Return exactly one JSON object with these fields:\n"
            "- title: English title or original title if already English.\n"
            "- subtitle: English subtitle, null if unavailable.\n"
            "- description: fluent English translation of the description, null if unavailable.\n"
            "- ai_summary: fluent English translation of the AI content summary.\n"
            "- tags: array with exactly the same number of tags as input, translated to concise English search tags.\n"
            "No markdown, no explanation.\n\n"
            "CATALOG_CONTEXT:\n"
            f"{publication_context or '(none)'}\n\n"
            "AI_SUMMARY_VI:\n"
            f"{ai_summary_vi}\n\n"
            "TAGS:\n"
            f"{json.dumps(tags, ensure_ascii=False)}"
        )

        raw = self._call(prompt, model=model)
        payload = self.extract_json_payload(raw)
        if not isinstance(payload, dict):
            raise LLMResponseError("Translation response is not a JSON object")

        translated_tags = payload.get("tags", [])
        if not isinstance(translated_tags, list):
            raise LLMResponseError("Translation response tags must be an array")

        return {
            "title": self._optional_string(payload.get("title")),
            "subtitle": self._optional_string(payload.get("subtitle")),
            "description": self._optional_string(payload.get("description")),
            "ai_summary": self._optional_string(payload.get("ai_summary")),
            "tags": [str(tag).strip()[:100] for tag in translated_tags if str(tag).strip()],
        }

    @staticmethod
    def _optional_string(value: Any) -> str | None:
        if value is None:
            return None
        text = str(value).strip()
        return text or None

    def _reduce_once(
        self,
        model: str,
        representative_chunks: list[str],
        publication_context: str = "",
    ) -> dict[str, Any]:

        faculty_values = ", ".join(sorted(FACULTY_TARGETS))

        prompt = f"""Bạn là một chuyên viên biên mục học thuật và thủ thư đại học.
Nhiệm vụ: Trích xuất metadata chuẩn xác từ CONTENT_EXCERPTS để phục vụ hệ thống quản lý thư viện thật.
CATALOG_CONTEXT chỉ dùng để nhận diện nhan đề/tác giả/chủ đề sơ bộ; không được biến CATALOG_CONTEXT thành nội dung tóm tắt nếu CONTENT_EXCERPTS không chứng minh.

### QUY TẮC CỐT LÕI
1. TÓM TẮT (master_summary):
- Chiều dài: 120-180 từ (4-6 câu).
- Trọng tâm: Nêu rõ tài liệu đang dạy/kể/nghiên cứu vấn đề gì, phạm vi chương mục chính, khái niệm/phương pháp trung tâm, kỹ năng hoặc giá trị đọc thực tế.
- Văn phong: Tiếng Việt tự nhiên, chuyên nghiệp, tự tin như một chuyên gia đã đọc và hiểu cuốn sách, hữu ích cho sinh viên khi quyết định mượn/đọc. Không mở đầu bằng "Tài liệu này thuộc...", "Hệ thống AI...", "File PDF...".
- Không nhắc đến quy trình xử lý dữ liệu hoặc mức độ chắc chắn của nguồn. Tuyệt đối không dùng các cụm như "Các đoạn OCR cho thấy", "dựa trên OCR", "nguồn là OCR", "PDF dạng ảnh", "chỉ sử dụng những ý đọc được", "tránh suy diễn", "có thể xác định", "phạm vi sơ bộ".
- Ngôn ngữ: master_summary bắt buộc viết bằng tiếng Việt. Không sao chép nguyên câu tiếng Anh từ CONTENT_EXCERPTS; hãy chuyển ý sang tiếng Việt. Chỉ giữ tiếng Anh cho tên riêng, nhan đề tác phẩm, thuật ngữ chuyên môn quen thuộc hoặc từ khóa thật sự cần thiết.
- Bám bằng chứng: Mỗi ý chính phải được CONTENT_EXCERPTS hỗ trợ. Không thêm tác giả, năm, chương, công nghệ, kết luận hoặc mục tiêu học tập nếu không thấy trong excerpts.
- Chỉ nhắc số chương/tên chương khi excerpts có mục lục hoặc tiêu đề chương rõ ràng. Nếu excerpts là các đoạn rời, hãy tóm tắt theo chủ đề/khái niệm thay vì liệt kê chương.
- Nếu excerpts chủ yếu là mục lục, copyright, reference, OCR rời rạc hoặc quá ít nội dung: vẫn viết bằng giọng biên mục chắc chắn, khái quát theo chủ đề học thuật quan sát được, không bịa chi tiết và không xin lỗi/không giải thích hạn chế nguồn.
- Chủ động lọc nhiễu OCR: số trang, header/footer, legal print, copyright, ISBN, mục lục, reference, code rời rạc, bảng công thức không có ngữ cảnh.

2. ĐỐI TƯỢNG (audience):
- Trích xuất đúng 1 mã khoa phù hợp nhất từ danh sách sau: {faculty_values}.
- Nếu CATALOG_CONTEXT thể hiện đây là tiểu thuyết/sách giải trí chung, bắt buộc dùng mã: TOAN_BO_SINH_VIEN_BKU.

3. TỪ KHÓA (tags & tags_en):
- Số lượng: 3-5 tags, chỉ thêm tag khi có tín hiệu rõ trong CONTENT_EXCERPTS hoặc CATALOG_CONTEXT. Ưu tiên đúng và chuyên biệt hơn là đủ số lượng.
- Phân loại: Dùng thuật ngữ chuyên ngành cụ thể (Ví dụ: Học Máy, Chuẩn Hóa Dữ Liệu, Kinh Dị Gothic). Tuyệt đối tránh các từ khóa quá rộng (như Sách, Kỹ Thuật, Ứng Dụng).
- Không dùng nhan đề sách, tên tác giả, tên khoa, tên category quá rộng, hoặc cụm mô tả chung như "Kiến Thức Nền Tảng", "Ứng Dụng Thực Tế", "Nội Dung Chuyên Ngành".
- Tiếng Anh: Dịch chuẩn xác theo thuật ngữ chuyên ngành thực tế, ưu tiên cụm từ người học hay tìm kiếm.

### ĐỊNH DẠNG ĐẦU RA (Strict JSON)
Bạn phải trả về DUY NHẤT 1 object JSON hợp lệ. Bắt buộc bỏ qua các block bọc markdown (như ```json) và không kèm bất kỳ giải thích nào để hệ thống parse trực tiếp.
Cấu trúc bắt buộc:
{{
    "master_summary": "Nội dung tóm tắt tiếng Việt...",
    "audience": "MÃ_KHOA_DUY_NHAT",
    "tags": ["Tag 1", "Tag 2", "Tag 3"],
    "tags_en": ["Tag 1 EN", "Tag 2 EN", "Tag 3 EN"]
}}

        ### DỮ LIỆU ĐẦU VÀO
        CATALOG_CONTEXT:
        {publication_context or '(không có)'}

        CONTENT_EXCERPTS:
        {json.dumps(representative_chunks, ensure_ascii=False)}
        """

        raw = self._call(prompt, model=model)
        payload = self.extract_json_payload(raw)
        if not isinstance(payload, dict):
            raise LLMResponseError("Reduce response is not a JSON object")

        master_summary = self._clean_assertive_summary(str(payload.get("master_summary", "")).strip())
        audience = self._coerce_audience(str(payload.get("audience", "")).strip(), master_summary)
        tags = payload.get("tags", [])
        tags_en = payload.get("tags_en", [])

        if not master_summary or not audience or not isinstance(tags, list):
            raise LLMResponseError("Reduce response missing required fields")

        raw_tags = [str(tag) for tag in tags if str(tag).strip()]
        raw_tags_en = [str(tag) for tag in tags_en if str(tag).strip()] if isinstance(tags_en, list) else []
        clean_tags: list[str] = []
        clean_tags_en_candidates: list[str] = []
        seen_tag_keys: set[str] = set()
        for index, raw_tag in enumerate(raw_tags):
            clean_tag = clean_ai_tag(raw_tag)
            tag_key = normalize_key(clean_tag)
            if (
                not clean_tag
                or tag_key in seen_tag_keys
                or is_low_quality_tag(clean_tag, publication_context)
            ):
                continue
            clean_tags.append(clean_tag)
            clean_tags_en_candidates.append(raw_tags_en[index] if index < len(raw_tags_en) else "")
            seen_tag_keys.add(tag_key)
            if len(clean_tags) >= 5:
                break

        for fallback_tag in self._fallback_tags_from_text(
            " ".join([master_summary, *representative_chunks]),
            publication_context,
        ):
            if len(clean_tags) >= 5:
                break
            if fallback_tag.lower() not in {tag.lower() for tag in clean_tags}:
                clean_tags.append(fallback_tag)
                clean_tags_en_candidates.append("")

        if len(clean_tags) < 3:
            raise LLMResponseError("Reduce response must contain at least 3 useful unique tags")

        if self._looks_like_catalog_summary(master_summary):
            raise LLMResponseError("Reduce summary appears to be catalog metadata, not content")
        if self._looks_low_value_summary(master_summary):
            raise LLMResponseError("Reduce summary is too generic or low value")
        if self._looks_english_dominant_summary(master_summary):
            raise LLMResponseError("Reduce summary must be written primarily in Vietnamese")

        clean_tags_en = align_english_tags(
            clean_tags,
            clean_tags_en_candidates,
        )

        return {
            "master_summary": master_summary,
            "audience": audience,
            "tags": clean_tags,
            "tags_en": clean_tags_en,
        }

    @staticmethod
    def _fallback_tags_from_text(text: str, publication_context: str = "") -> list[str]:
        return suggest_tags_from_text(text, publication_context, limit=5)

    @staticmethod
    def _clean_assertive_summary(summary: str) -> str:
        clean = re.sub(r"\s+", " ", summary).strip()
        if not clean:
            return ""

        blocked_patterns = (
            r"(?i)\b(các\s+)?đoạn\s+ocr\s+cho\s+thấy\b",
            r"(?i)\b(dựa\s+trên|theo|từ)\s+(các\s+)?(đoạn\s+)?ocr\b",
            r"(?i)\bnguồn\s+là\s+ocr\b",
            r"(?i)\bpdf\s+dạng\s+ảnh\b",
            r"(?i)\bbản\s+tóm\s+tắt\s+này\s+chỉ\s+sử\s+dụng\b",
            r"(?i)\bchỉ\s+sử\s+dụng\s+những\s+ý\s+đọc\s+được\b",
            r"(?i)\btránh\s+suy\s+diễn\s+ngoài\s+văn\s+bản\b",
            r"(?i)\bchỉ\s+có\s+thể\s+xác\s+định\s+phạm\s+vi\s+sơ\s+bộ\b",
        )
        sentences = [sentence.strip() for sentence in re.split(r"(?<=[.!?])\s+", clean) if sentence.strip()]
        kept: list[str] = []
        for sentence in sentences:
            rewritten = re.sub(
                r"(?i)^(các\s+)?đoạn\s+ocr\s+cho\s+thấy\s+",
                "",
                sentence,
            ).strip()
            if any(re.search(pattern, rewritten) for pattern in blocked_patterns):
                continue
            if rewritten:
                kept.append(rewritten)

        cleaned = " ".join(kept).strip() or clean
        cleaned = re.sub(r"(?i)^(các\s+)?đoạn\s+ocr\s+cho\s+thấy\s+", "", cleaned).strip()
        if cleaned:
            cleaned = cleaned[0].upper() + cleaned[1:]
        return cleaned

    @staticmethod
    def _looks_like_catalog_summary(summary: str) -> bool:
        lowered = summary.lower()
        blocked_phrases = (
            "publication id:",
            "language:",
            "publication year:",
            "authors:",
            "categories:",
            "tags:",
            "ai summary:",
            "hệ thống ai",
            "lập chỉ mục",
            "metadata",
            "thuộc nhóm",
            "các chủ đề nổi bật gồm",
            "file pdf",
            "đoạn ocr",
            "các đoạn ocr",
            "nguồn là ocr",
            "pdf dạng ảnh",
            "tránh suy diễn",
            "chỉ sử dụng những ý đọc được",
            "thư viện",
            "project gutenberg",
            "legal small print",
            "donation",
            "license",
            "trademark",
            "trade names",
            "endorses this work",
            "illustrative and educational purposes",
        )
        return any(phrase in lowered for phrase in blocked_phrases)

    @staticmethod
    def _looks_low_value_summary(summary: str) -> bool:
        clean = re.sub(r"\s+", " ", summary).strip()
        if len(clean) < 220:
            return True

        sentences = [sentence.strip() for sentence in re.split(r"(?<=[.!?])\s+", clean) if sentence.strip()]
        if len(sentences) < 3:
            return True

        lowered = clean.lower()
        generic_phrases = (
            "cung cấp kiến thức tổng quan",
            "giúp người đọc hiểu rõ hơn",
            "phù hợp với sinh viên",
            "nhiều khía cạnh khác nhau",
            "các chủ đề liên quan",
            "nội dung phong phú",
            "kiến thức nền tảng",
            "ứng dụng thực tế",
        )
        if sum(phrase in lowered for phrase in generic_phrases) >= 3:
            return True

        unique_words = set(re.findall(r"[\wÀ-ỹ]+", lowered, flags=re.UNICODE))
        total_words = re.findall(r"[\wÀ-ỹ]+", lowered, flags=re.UNICODE)
        return bool(total_words) and len(unique_words) / len(total_words) < 0.38

    @staticmethod
    def _looks_english_dominant_summary(summary: str) -> bool:
        words = re.findall(r"[A-Za-zÀ-ỹ]+", summary, flags=re.UNICODE)
        if len(words) < 30:
            return False

        vietnamese_markers = re.findall(r"[ăâêôơưđáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]", summary.lower())
        if len(vietnamese_markers) >= max(8, len(words) // 10):
            return False

        common_english = {
            "a", "about", "and", "are", "as", "at", "be", "book", "by", "can", "case", "cases",
            "chapter", "content", "describes", "discusses", "each", "for", "from", "has", "in",
            "is", "it", "medical", "of", "on", "or", "patients", "people", "present", "that",
            "the", "their", "this", "through", "to", "with",
        }
        normalized_words = [word.lower() for word in words]
        english_hits = sum(word in common_english for word in normalized_words)
        return english_hits / max(len(normalized_words), 1) >= 0.18

    @staticmethod
    def _coerce_audience(raw_audience: str, summary: str) -> str:
        if raw_audience in FACULTY_TARGETS:
            return raw_audience

        text = f"{raw_audience} {summary}".lower()
        if any(keyword in text for keyword in ("văn học", "tiểu thuyết", "fiction", "novel", "literature", "khai phóng", "giải trí")):
            return "TOAN_BO_SINH_VIEN_BKU"
        keyword_map = [
            ("KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH", ("computer", "software", "algorithm", "data", "ai", "machine learning", "lập trình", "thuật toán", "cơ sở dữ liệu", "máy tính")),
            ("KHOA_DIEN_DIEN_TU", ("điện", "điện tử", "mạch", "signal", "circuit", "electronics")),
            ("KHOA_CO_KHI", ("cơ khí", "mechanical", "machine design", "manufacturing")),
            ("KHOA_KY_THUAT_HOA_HOC", ("hóa", "chemical", "chemistry")),
            ("KHOA_KY_THUAT_XAY_DUNG", ("xây dựng", "construction", "civil")),
            ("KHOA_KY_THUAT_GIAO_THONG", ("giao thông", "transport", "traffic")),
            ("KHOA_QUAN_LY_CONG_NGHIEP", ("quản lý", "management", "industrial")),
            ("KHOA_MOI_TRUONG_VA_TAI_NGUYEN", ("môi trường", "environment", "resource")),
            ("KHOA_CONG_NGHE_VAT_LIEU", ("vật liệu", "material")),
            ("KHOA_KHOA_HOC_UNG_DUNG", ("toán", "physics", "applied", "ứng dụng")),
            ("KHOA_KY_THUAT_DIA_CHAT_VA_DAU_KHI", ("địa chất", "dầu khí", "geology", "petroleum")),
        ]
        for faculty, keywords in keyword_map:
            if any(keyword in text for keyword in keywords):
                return faculty
        return "TOAN_BO_SINH_VIEN_BKU"
