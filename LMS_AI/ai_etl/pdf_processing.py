from __future__ import annotations

import re
import tempfile
import unicodedata
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Union

import fitz
import requests


@dataclass(frozen=True)
class Chunk:
    chunk_id: str
    text: str

_NULL_CHAR_PATTERN = re.compile(r"\x00")
_WHITESPACE_PATTERN = re.compile(r"\s+")
_PAGE_NUMBER_PATTERN = re.compile(
    r"^\s*(?:[-–—]\s*)?(?:page|trang)?\s*\d+(?:\s*/\s*\d+)?(?:\s*[-–—])?\s*$",
    re.IGNORECASE,
)
_HEADER_FOOTER_REPEAT_THRESHOLD = 2
_GUTENBERG_BOUNDARY_PATTERN = re.compile(
    r"\*{3}\s*(START|END)\s+OF\s+(?:THE\s+)?PROJECT\s+GUTENBERG\s+EBOOK[^*]*\*{3}",
    re.IGNORECASE,
)
_GUTENBERG_LEGACY_START_PATTERN = re.compile(
    r"(?:START|END)\s+OF\s+(?:THIS\s+)?PROJECT\s+GUTENBERG\s+EBOOK",
    re.IGNORECASE,
)
_GUTENBERG_NOISE_PATTERNS = (
    re.compile(r"(?is)this\s+header\s+should\s+be\s+the\s+first\s+thing\s+seen.*?(?=\bchapter\s+1\b|\bchapter\s+i\b|$)"),
    re.compile(r"(?is)please\s+read\s+the\s+\"?legal\s+small\s+print.*?(?=\bchapter\s+1\b|\bchapter\s+i\b|$)"),
    re.compile(r"(?is)project\s+gutenberg(?:'s)?\s+.*?license.*?(?=\bchapter\s+1\b|\bchapter\s+i\b|$)"),
)
_LEGAL_OR_PUBLISHER_NOISE_TERMS = (
    "all rights reserved",
    "copyright",
    "creative commons",
    "endorses this work",
    "for illustrative and educational purposes",
    "international standard book number",
    "isbn",
    "license",
    "no part of this",
    "permission",
    "registered trademark",
    "trademark",
    "trade names",
)
_STRUCTURAL_NOISE_LINE_PATTERN = re.compile(
    r"^\s*(?:"
    r"contents?|table\s+of\s+contents|references|bibliography|index|"
    r"list\s+of\s+figures|list\s+of\s+tables|acknowledg(?:e)?ments?|"
    r"mục\s+lục|tài\s+liệu\s+tham\s+khảo|phụ\s+lục"
    r")\s*$",
    re.IGNORECASE,
)
_SENTENCE_BOUNDARY_PATTERN = re.compile(r"(?<=[.!?。！？])\s+")
_MIN_OCR_ALPHA_RATIO = 0.45
_BROKEN_OCR_TOKEN_PATTERN = re.compile(
    r"\b(?=[A-Za-z0-9_~.-]{6,}\b)(?=\S*[A-Za-z])(?=\S*(?:\d|_|~))[A-Za-z0-9_~.-]+\b"
)
_BROKEN_SHORT_OCR_TOKEN_PATTERN = re.compile(r"(?<!\w)[a-zA-Z]{1,4}\._+")


def _looks_like_broken_ocr_line(line: str) -> bool:
    if len(line) < 24:
        return False

    tokens = re.findall(r"[A-Za-zÀ-ỹ0-9_~.-]+", line)
    if not tokens:
        return True

    broken_tokens = [
        token for token in tokens
        if _BROKEN_OCR_TOKEN_PATTERN.fullmatch(token)
        or _BROKEN_SHORT_OCR_TOKEN_PATTERN.fullmatch(token)
    ]
    symbol_ratio = sum(1 for ch in line if ch in "_~^`|{}[]<>\\") / max(len(line), 1)
    digit_ratio = sum(ch.isdigit() for ch in line) / max(len(line), 1)

    return len(broken_tokens) / max(len(tokens), 1) > 0.22 or symbol_ratio > 0.08 or digit_ratio > 0.28


def clean_ocr_artifacts(text: str) -> str:
    """Drop OCR garbage tokens/lines while preserving readable prose."""
    if not text:
        return ""

    text = unicodedata.normalize("NFKC", text)
    kept_lines: list[str] = []
    for raw_line in text.splitlines() or [text]:
        line = _NULL_CHAR_PATTERN.sub("", raw_line)
        line = _BROKEN_SHORT_OCR_TOKEN_PATTERN.sub(" ", line)
        line = _BROKEN_OCR_TOKEN_PATTERN.sub(" ", line)
        line = re.sub(r"([A-Za-zÀ-ỹ])~+\b", r"\1", line)
        line = re.sub(r"\s+", " ", line).strip()
        if not line or _looks_like_broken_ocr_line(line):
            continue
        kept_lines.append(line)

    return _WHITESPACE_PATTERN.sub(" ", " ".join(kept_lines)).strip()


def sanitize_text(text: str) -> str:
    """Remove PostgreSQL-breaking null chars and normalize noisy spacing."""
    text = _NULL_CHAR_PATTERN.sub("", text)
    text = clean_ocr_artifacts(text)
    text = _WHITESPACE_PATTERN.sub(" ", text)
    return text.strip()


def strip_public_domain_boilerplate(text: str) -> str:
    """Remove public-domain boilerplate that should not be indexed or summarized."""
    if not text:
        return ""

    matches = list(_GUTENBERG_BOUNDARY_PATTERN.finditer(text))
    if matches:
        start_match = next((match for match in matches if match.group(1).lower() == "start"), None)
        end_match = next((match for match in matches if match.group(1).lower() == "end"), None)
        start = start_match.end() if start_match else 0
        end = end_match.start() if end_match and end_match.start() > start else len(text)
        text = text[start:end]
    else:
        legacy_matches = list(_GUTENBERG_LEGACY_START_PATTERN.finditer(text))
        if legacy_matches:
            first = legacy_matches[0]
            if "start" in first.group(0).lower():
                text = text[first.end():]
            if len(legacy_matches) > 1 and "end" in legacy_matches[-1].group(0).lower():
                text = text[: legacy_matches[-1].start()]

    for pattern in _GUTENBERG_NOISE_PATTERNS:
        text = pattern.sub(" ", text)

    return sanitize_text(text)


def strip_legal_and_publisher_boilerplate(text: str) -> str:
    """Remove legal, trademark, and publisher boilerplate without targeting a title."""
    if not text:
        return ""

    sentences = re.split(r"(?<=[.!?])\s+", text)
    kept: list[str] = []
    for sentence in sentences:
        lowered = sentence.lower()
        if any(term in lowered for term in _LEGAL_OR_PUBLISHER_NOISE_TERMS):
            continue
        kept.append(sentence)

    return sanitize_text(" ".join(kept))


def _normalize_layout_line(line: str) -> str:
    line = _NULL_CHAR_PATTERN.sub("", line)
    line = re.sub(r"\s+", " ", line).strip()
    return line


def _line_signature(line: str) -> str:
    signature = _compact_whitespace(line.lower())
    signature = re.sub(r"\d+", "#", signature)
    return signature.strip(" -–—|")


def _compact_whitespace(value: str) -> str:
    return " ".join(value.split())


def _clean_pdf_pages(page_texts: list[str]) -> str:
    """Remove repeated page furniture before downstream chunking."""
    line_counts: dict[str, int] = {}
    page_lines: list[list[str]] = []

    for page_text in page_texts:
        lines = [_normalize_layout_line(line) for line in page_text.splitlines()]
        lines = [line for line in lines if line]
        page_lines.append(lines)

        candidates = lines[:3] + lines[-3:]
        page_signatures: set[str] = set()
        for line in candidates:
            if _PAGE_NUMBER_PATTERN.match(line):
                continue
            signature = _line_signature(line)
            if signature and signature not in page_signatures:
                line_counts[signature] = line_counts.get(signature, 0) + 1
                page_signatures.add(signature)

    min_repeats = min(
        max(_HEADER_FOOTER_REPEAT_THRESHOLD, len(page_texts) // 3),
        max(_HEADER_FOOTER_REPEAT_THRESHOLD, len(page_texts)),
    )
    repeated_furniture = {
        signature for signature, count in line_counts.items()
        if count >= min_repeats
    }

    cleaned_parts: list[str] = []
    for lines in page_lines:
        kept: list[str] = []
        for line in lines:
            if _PAGE_NUMBER_PATTERN.match(line):
                continue
            if _STRUCTURAL_NOISE_LINE_PATTERN.match(line):
                continue
            if _line_signature(line) in repeated_furniture:
                continue
            kept.append(line)
        cleaned_parts.append(" ".join(kept))

    text = "\n".join(cleaned_parts)
    text = re.sub(r"(?<=\w)-\s+(?=\w)", "", text)
    return strip_legal_and_publisher_boilerplate(strip_public_domain_boilerplate(text))


def _select_ocr_page_indices(page_count: int, max_pages: int) -> list[int]:
    if page_count <= 0 or max_pages <= 0:
        return []
    if page_count <= max_pages:
        return list(range(page_count))

    first_count = min(8, max_pages // 3, page_count)
    last_count = min(4, max_pages // 6, page_count - first_count)
    selected = set(range(first_count))
    if last_count > 0:
        selected.update(range(page_count - last_count, page_count))

    remaining = max_pages - len(selected)
    if remaining > 0:
        start = first_count
        end = page_count - last_count - 1
        if end >= start:
            if remaining == 1:
                selected.add((start + end) // 2)
            else:
                for step in range(remaining):
                    selected.add(round(start + (end - start) * step / (remaining - 1)))

    return sorted(index for index in selected if 0 <= index < page_count)[:max_pages]


def _ocr_pdf_pages(
    doc: fitz.Document,
    *,
    max_pages: int,
    dpi: int,
    language: str,
) -> str:
    try:
        import pytesseract
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError(
            "OCR fallback requires pytesseract, Pillow, and the Tesseract binary. "
            "Install Docker image dependencies or disable AI_ETL_ENABLE_OCR_FALLBACK."
        ) from exc

    page_texts: list[str] = []
    matrix = fitz.Matrix(dpi / 72.0, dpi / 72.0)
    for page_index in _select_ocr_page_indices(doc.page_count, max_pages):
        page = doc[page_index]
        pixmap = page.get_pixmap(matrix=matrix, alpha=False, colorspace=fitz.csGRAY)
        image = Image.open(BytesIO(pixmap.tobytes("png")))
        text = pytesseract.image_to_string(image, lang=language, config="--psm 6")
        text = sanitize_text(text)
        if text:
            page_texts.append(text)

    return _clean_pdf_pages(page_texts)


def _has_usable_ocr_text(text: str, min_text_chars: int) -> bool:
    clean = sanitize_text(text)
    if len(clean) < min_text_chars:
        return False
    alpha_ratio = sum(ch.isalpha() for ch in clean) / max(len(clean), 1)
    return alpha_ratio >= _MIN_OCR_ALPHA_RATIO


def extract_pdf_text(
    pdf_source: Union[Path, str],
    *,
    enable_ocr_fallback: bool = False,
    ocr_max_pages: int = 32,
    ocr_dpi: int = 160,
    ocr_language: str = "eng+vie",
    ocr_min_text_chars: int = 500,
) -> str:
    """Extract text from PDF file or URL.

    Args:
        pdf_source: Either a Path to local file or a URL string
    """
    if isinstance(pdf_source, str) and (pdf_source.startswith('http://') or pdf_source.startswith('https://')):
        # Download PDF from URL
        response = requests.get(pdf_source, timeout=30)
        response.raise_for_status()
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            tmp.write(response.content)
            tmp_path = tmp.name
        try:
            doc = fitz.open(tmp_path)
        finally:
            tmp_path_obj = Path(tmp_path)
    else:
        # Local file
        doc = fitz.open(str(pdf_source))

    try:
        parts = [page.get_text("text") or "" for page in doc]
        text = _clean_pdf_pages(parts)
        if text or not enable_ocr_fallback:
            return text

        ocr_text = _ocr_pdf_pages(
            doc,
            max_pages=ocr_max_pages,
            dpi=ocr_dpi,
            language=ocr_language,
        )
        if _has_usable_ocr_text(ocr_text, ocr_min_text_chars):
            return ocr_text
        return ""
    finally:
        doc.close()
        if isinstance(pdf_source, str) and (pdf_source.startswith('http://') or pdf_source.startswith('https://')):
            tmp_path_obj.unlink(missing_ok=True)


def sliding_window_chunk(text: str, chunk_size: int, overlap: int) -> list[Chunk]:
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    if overlap < 0:
        raise ValueError("overlap must be non-negative")
    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")

    if not text:
        return []

    text = sanitize_text(text)
    if not text:
        return []

    if not re.search(r"\s", text):
        return _fixed_window_chunk(text, chunk_size, overlap)

    return _semantic_window_chunk(text, chunk_size, overlap)


def _fixed_window_chunk(
    text: str,
    chunk_size: int,
    overlap: int,
    start_index: int = 1,
) -> list[Chunk]:
    step = chunk_size - overlap
    chunks: list[Chunk] = []

    start = 0
    index = 1
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk_text = text[start:end].strip()
        if chunk_text:
            chunks.append(Chunk(chunk_id=f"c{start_index + index - 1:05d}", text=chunk_text))
            index += 1

        if end >= len(text):
            break
        start += step

    return chunks


def _semantic_window_chunk(text: str, chunk_size: int, overlap: int) -> list[Chunk]:
    """Create chunks at sentence/paragraph boundaries when possible.

    The overlap is still character-budgeted, but it reuses whole trailing
    sentences so reduce prompts do not start in the middle of a concept.
    """
    paragraphs = [part.strip() for part in re.split(r"\n{2,}", text) if part.strip()]
    if not paragraphs:
        paragraphs = [text]

    units: list[str] = []
    for paragraph in paragraphs:
        sentences = [part.strip() for part in _SENTENCE_BOUNDARY_PATTERN.split(paragraph) if part.strip()]
        units.extend(sentences or [paragraph])

    chunks: list[Chunk] = []
    current_units: list[str] = []
    current_len = 0

    def flush() -> None:
        nonlocal current_units, current_len
        chunk_text = " ".join(current_units).strip()
        if chunk_text:
            chunks.append(Chunk(chunk_id=f"c{len(chunks) + 1:05d}", text=chunk_text))

        if overlap <= 0:
            current_units = []
            current_len = 0
            return

        overlap_units: list[str] = []
        overlap_len = 0
        for unit in reversed(current_units):
            unit_len = len(unit) + (1 if overlap_units else 0)
            if overlap_units and overlap_len + unit_len > overlap:
                break
            if not overlap_units and unit_len > overlap:
                break
            overlap_units.insert(0, unit)
            overlap_len += unit_len
        current_units = overlap_units
        current_len = len(" ".join(current_units))

    for unit in units:
        if len(unit) > chunk_size:
            if current_units:
                flush()
            chunks.extend(_fixed_window_chunk(unit, chunk_size, overlap, start_index=len(chunks) + 1))
            current_units = []
            current_len = 0
            continue

        projected_len = current_len + len(unit) + (1 if current_units else 0)
        if current_units and projected_len > chunk_size:
            flush()
            projected_len = current_len + len(unit) + (1 if current_units else 0)
            if current_units and projected_len > chunk_size:
                current_units = []
                current_len = 0

        current_units.append(unit)
        current_len = len(" ".join(current_units))

    if current_units:
        chunk_text = " ".join(current_units).strip()
        if chunk_text:
            chunks.append(Chunk(chunk_id=f"c{len(chunks) + 1:05d}", text=chunk_text))

    return chunks
