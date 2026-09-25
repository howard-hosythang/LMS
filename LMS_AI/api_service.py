from __future__ import annotations

import asyncio
import re
import unicodedata
from contextlib import asynccontextmanager, contextmanager
from dataclasses import dataclass

import numpy as np
from ai_etl.config import Settings as EtlSettings
from ai_etl.config import load_settings as load_etl_settings
from ai_etl.db import Database
from ai_etl.db import DatabaseConnectionPool
from ai_etl.embedding_client import EmbeddingClient
from ai_etl.llm_client import GeminiClient
from ai_etl.pipeline import AIEtlPipeline
from ai_etl.pdf_processing import Chunk, extract_pdf_text, sliding_window_chunk
from ai_gateway.config import ApiSettings, load_api_settings
from ai_gateway.recommender import RecommenderEngine
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from psycopg2.extras import Json
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer


@dataclass
class AppState:
    settings: ApiSettings
    etl_settings: EtlSettings
    db_pool: DatabaseConnectionPool
    etl_database: Database
    etl_pipeline: AIEtlPipeline
    embedding_model: SentenceTransformer
    recommender: RecommenderEngine
    retrain_task: asyncio.Task | None = None


class SemanticSearchRequest(BaseModel):
    query_text: str = Field(min_length=2, max_length=5000)
    limit: int | None = Field(default=None, ge=1, le=100)


class SemanticSearchResponse(BaseModel):
    publication_ids: list[int]


class SimilarPublicationsResponse(BaseModel):
    publication_ids: list[int]


class RecommendationRequest(BaseModel):
    user_id: int = Field(gt=0)
    faculty: str | None = Field(default=None, max_length=100)
    limit: int | None = Field(default=None, ge=1, le=100)


class RecommendationResponse(BaseModel):
    publication_ids: list[int]
    strategy: str


class ProcessPublicationRequest(BaseModel):
    publication_id: int = Field(gt=0)
    pdf_url: str | None = Field(default=None, min_length=1, max_length=5000)
    force_reprocess: bool = False


class ProcessPublicationResponse(BaseModel):
    publication_id: int
    status: str
    skipped: bool
    chunks: int
    vectors: int
    summary_generated: bool
    tags: list[str]
    ai_target_audience: str | None = None
    error: str | None = None


class VectorizePublicationResponse(BaseModel):
    publication_id: int
    status: str
    chunks: int
    vectors: int
    error: str | None = None


class MetadataPublicationResponse(BaseModel):
    publication_id: int
    status: str
    reduce_inputs: int
    summary_generated: bool
    tags: list[str]
    ai_target_audience: str | None = None
    error: str | None = None


class RefreshRecommendationRequest(BaseModel):
    user_id: int = Field(gt=0)
    limit: int | None = Field(default=None, ge=1, le=100)


def _vector_to_pg_literal(vector: list[float]) -> str:
    # Parameterized query + explicit vector cast avoids SQL injection risk.
    return "[" + ",".join(f"{x:.10f}" for x in vector) + "]"


def _pg_vector_to_list(value) -> list[float]:
    if value is None:
        return []
    if isinstance(value, list):
        return [float(item) for item in value]
    if isinstance(value, np.ndarray):
        return [float(item) for item in value.tolist()]
    text = str(value).strip()
    if text.startswith("[") and text.endswith("]"):
        text = text[1:-1]
    return [float(part) for part in text.split(",") if part.strip()]


@contextmanager
def _pooled_connection(app_state: AppState):
    with app_state.db_pool.connection() as conn:
        yield conn


class _SharedEmbeddingClient(EmbeddingClient):
    def __init__(self, model: SentenceTransformer) -> None:
        self.model = model


def _semantic_search_publication_ids(
    app_state: AppState,
    query_vector: list[float],
    limit: int,
    min_similarity: float | None = None,
) -> list[int]:
    vector_literal = _vector_to_pg_literal(query_vector)
    candidate_limit = max(limit * 20, 100)
    similarity_threshold = (
        min_similarity if min_similarity is not None else app_state.settings.search_min_similarity
    )
    max_distance = 1.0 - similarity_threshold

    with _pooled_connection(app_state) as conn:
        with conn.cursor() as cur:
            cur.execute("SET LOCAL statement_timeout = %s", (app_state.settings.statement_timeout_ms,))
            cur.execute(
                """
                WITH nearest_chunks AS (
                    SELECT publication_id, embedding <=> %s::vector AS distance
                    FROM ai_engine.publication_vectors
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s
                )
                SELECT publication_id, MIN(distance) AS min_distance
                FROM nearest_chunks
                GROUP BY publication_id
                HAVING MIN(distance) <= %s
                ORDER BY min_distance ASC
                LIMIT %s
                """,
                (vector_literal, vector_literal, candidate_limit, max_distance, limit),
            )
            return [int(row[0]) for row in cur.fetchall()]


def _chunk_keyword_search(app_state: AppState, query_text: str, limit: int) -> list[int]:
    query_text = " ".join(query_text.strip().split())
    phrases = _expanded_search_phrases(query_text)
    if query_text and query_text.lower() not in {phrase.lower() for phrase in phrases}:
        phrases.insert(0, query_text)
    query_terms = _meaningful_query_terms(query_text)

    if not phrases:
        return []

    phrase_likes = [f"%{phrase}%" for phrase in phrases]
    phrase_conditions = " OR ".join(["pv.chunk_text ILIKE %s" for _phrase in phrases])
    term_likes = [f"%{term}%" for term in query_terms] if len(query_terms) >= 2 else []
    term_conditions = " AND ".join(["pv.chunk_text ILIKE %s" for _term in term_likes])
    where_conditions = [f"({phrase_conditions})"]
    if term_conditions:
        where_conditions.append(f"({term_conditions})")
    where_sql = " OR ".join(where_conditions)

    with _pooled_connection(app_state) as conn:
        with conn.cursor() as cur:
            cur.execute("SET LOCAL statement_timeout = %s", (app_state.settings.statement_timeout_ms,))
            cur.execute(
                f"""
                SELECT
                    pv.publication_id,
                    COUNT(*) FILTER (WHERE {phrase_conditions}) AS phrase_hits,
                    COUNT(*) AS chunk_hits,
                    MIN(pv.id) AS first_hit_id
                FROM ai_engine.publication_vectors pv
                WHERE {where_sql}
                GROUP BY pv.publication_id
                ORDER BY
                    phrase_hits DESC,
                    chunk_hits DESC,
                    first_hit_id ASC
                LIMIT %s
                """,
                (*phrase_likes, *phrase_likes, *term_likes, limit),
            )
            return [int(row[0]) for row in cur.fetchall()]


def _similar_publication_ids(
    app_state: AppState,
    publication_id: int,
    limit: int,
) -> list[int]:
    with _pooled_connection(app_state) as conn:
        with conn.cursor() as cur:
            cur.execute("SET LOCAL statement_timeout = %s", (app_state.settings.statement_timeout_ms,))
            cur.execute(
                """
                SELECT embedding
                FROM ai_engine.publication_vectors
                WHERE publication_id = %s
                ORDER BY id ASC
                LIMIT 80
                """,
                (publication_id,),
            )
            rows = cur.fetchall()

    if not rows:
        return []

    vectors = np.array([np.asarray(row[0], dtype=np.float32) for row in rows], dtype=np.float32)
    profile = vectors.mean(axis=0)
    norm = np.linalg.norm(profile)
    if norm == 0:
        return []

    profile = profile / norm
    vector_literal = _vector_to_pg_literal(profile.tolist())
    candidate_limit = max(limit * 30, 150)

    with _pooled_connection(app_state) as conn:
        with conn.cursor() as cur:
            cur.execute("SET LOCAL statement_timeout = %s", (app_state.settings.statement_timeout_ms,))
            cur.execute(
                """
                WITH nearest_chunks AS (
                    SELECT pv.publication_id, pv.embedding <=> %s::vector AS distance
                    FROM ai_engine.publication_vectors pv
                    WHERE pv.publication_id <> %s
                      AND EXISTS (
                          SELECT 1
                          FROM public.items i
                          WHERE i.publication_id = pv.publication_id
                            AND i.status = 'AVAILABLE'
                      )
                    ORDER BY pv.embedding <=> %s::vector
                    LIMIT %s
                )
                SELECT publication_id, MIN(distance) AS min_distance
                FROM nearest_chunks
                GROUP BY publication_id
                ORDER BY min_distance ASC
                LIMIT %s
                """,
                (vector_literal, publication_id, vector_literal, candidate_limit, limit),
            )
            return [int(row[0]) for row in cur.fetchall()]


def _has_publication_vectors(app_state: AppState) -> bool:
    with _pooled_connection(app_state) as conn:
        with conn.cursor() as cur:
            cur.execute("SET LOCAL statement_timeout = %s", (app_state.settings.statement_timeout_ms,))
            cur.execute("SELECT EXISTS(SELECT 1 FROM ai_engine.publication_vectors LIMIT 1)")
            row = cur.fetchone()
            return bool(row and row[0])


def _has_user_interactions(app_state: AppState, user_id: int) -> bool:
    with _pooled_connection(app_state) as conn:
        with conn.cursor() as cur:
            cur.execute("SET LOCAL statement_timeout = %s", (app_state.settings.statement_timeout_ms,))
            cur.execute(
                """
                SELECT EXISTS(
                    SELECT 1
                    FROM public.user_interactions
                    WHERE user_id = %s
                )
                """,
                (user_id,),
            )
            row = cur.fetchone()
            return bool(row and row[0])


def _content_based_recommendations(
    app_state: AppState,
    user_id: int,
    limit: int,
    exclude_publication_ids: list[int] | None = None,
) -> list[int]:
    excluded_ids = set(exclude_publication_ids or [])

    with _pooled_connection(app_state) as conn:
        with conn.cursor() as cur:
            cur.execute("SET LOCAL statement_timeout = %s", (app_state.settings.statement_timeout_ms,))
            cur.execute(
                """
                SELECT DISTINCT publication_id
                FROM public.user_interactions
                WHERE user_id = %s
                """,
                (user_id,),
            )
            interacted_ids = {int(row[0]) for row in cur.fetchall()}
            excluded_ids.update(interacted_ids)

            cur.execute(
                """
                SELECT
                    pv.embedding,
                    CASE ui.type
                        WHEN 'WATCH' THEN 1.0
                        WHEN 'WISHLIST' THEN 5.0
                        WHEN 'BORROWED' THEN 10.0
                        ELSE 1.0
                    END AS weight
                FROM public.user_interactions ui
                JOIN ai_engine.publication_vectors pv ON pv.publication_id = ui.publication_id
                WHERE ui.user_id = %s
                ORDER BY ui.created_at DESC NULLS LAST, ui.id DESC
                LIMIT 300
                """,
                (user_id,),
            )
            profile_rows = cur.fetchall()

    if not profile_rows:
        return []

    vectors = np.array([np.asarray(row[0], dtype=np.float32) for row in profile_rows], dtype=np.float32)
    weights = np.array([float(row[1]) for row in profile_rows], dtype=np.float32)
    profile = np.average(vectors, axis=0, weights=weights)
    norm = np.linalg.norm(profile)
    if norm == 0:
        return []
    profile = profile / norm

    vector_literal = _vector_to_pg_literal(profile.tolist())
    candidate_limit = max(limit * 30, 150)
    excluded_list = list(excluded_ids) or [-1]

    with _pooled_connection(app_state) as conn:
        with conn.cursor() as cur:
            cur.execute("SET LOCAL statement_timeout = %s", (app_state.settings.statement_timeout_ms,))
            cur.execute(
                """
                WITH nearest_chunks AS (
                    SELECT pv.publication_id, pv.embedding <=> %s::vector AS distance
                    FROM ai_engine.publication_vectors pv
                    WHERE NOT (pv.publication_id = ANY(%s))
                      AND EXISTS (
                          SELECT 1
                          FROM public.items i
                          WHERE i.publication_id = pv.publication_id
                            AND i.status = 'AVAILABLE'
                      )
                    ORDER BY pv.embedding <=> %s::vector
                    LIMIT %s
                )
                SELECT publication_id, MIN(distance) AS min_distance
                FROM nearest_chunks
                GROUP BY publication_id
                ORDER BY min_distance ASC
                LIMIT %s
                """,
                (vector_literal, excluded_list, vector_literal, candidate_limit, limit),
            )
            return [int(row[0]) for row in cur.fetchall()]


def _metadata_based_recommendations(
    app_state: AppState,
    user_id: int,
    limit: int,
    exclude_publication_ids: list[int] | None = None,
) -> list[int]:
    excluded_ids = set(exclude_publication_ids or [])

    with _pooled_connection(app_state) as conn:
        with conn.cursor() as cur:
            cur.execute("SET LOCAL statement_timeout = %s", (app_state.settings.statement_timeout_ms,))
            cur.execute(
                """
                SELECT DISTINCT publication_id
                FROM public.user_interactions
                WHERE user_id = %s
                """,
                (user_id,),
            )
            interacted_ids = {int(row[0]) for row in cur.fetchall()}
            excluded_ids.update(interacted_ids)
            if not interacted_ids:
                return []

            excluded_list = list(excluded_ids) or [-1]
            cur.execute(
                """
                WITH user_publications AS (
                    SELECT UNNEST(%s::bigint[]) AS publication_id
                ),
                user_categories AS (
                    SELECT DISTINCT pc.category_id
                    FROM public.publication_categories pc
                    JOIN user_publications up ON up.publication_id = pc.publication_id
                ),
                user_tags AS (
                    SELECT DISTINCT pt.tag_id
                    FROM public.publication_tags pt
                    JOIN user_publications up ON up.publication_id = pt.publication_id
                ),
                user_authors AS (
                    SELECT DISTINCT pa.author_id
                    FROM public.publication_authors pa
                    JOIN user_publications up ON up.publication_id = pa.publication_id
                )
                SELECT
                    p.id,
                    COUNT(DISTINCT pc.category_id) * 8
                    + COUNT(DISTINCT pt.tag_id) * 6
                    + COUNT(DISTINCT pa.author_id) * 3 AS score
                FROM public.publications p
                LEFT JOIN public.publication_categories pc
                    ON pc.publication_id = p.id
                   AND pc.category_id IN (SELECT category_id FROM user_categories)
                LEFT JOIN public.publication_tags pt
                    ON pt.publication_id = p.id
                   AND pt.tag_id IN (SELECT tag_id FROM user_tags)
                LEFT JOIN public.publication_authors pa
                    ON pa.publication_id = p.id
                   AND pa.author_id IN (SELECT author_id FROM user_authors)
                WHERE NOT (p.id = ANY(%s))
                  AND EXISTS (
                      SELECT 1
                      FROM public.items i
                      WHERE i.publication_id = p.id
                        AND i.status = 'AVAILABLE'
                  )
                GROUP BY p.id
                HAVING COUNT(DISTINCT pc.category_id) > 0
                    OR COUNT(DISTINCT pt.tag_id) > 0
                    OR COUNT(DISTINCT pa.author_id) > 0
                ORDER BY score DESC, p.created_at DESC NULLS LAST, p.id ASC
                LIMIT %s
                """,
                (list(interacted_ids), excluded_list, limit),
            )
            return [int(row[0]) for row in cur.fetchall()]


def _merge_ranked_unique(primary: list[int], secondary: list[int], limit: int) -> list[int]:
    merged: list[int] = []
    seen: set[int] = set()
    for publication_id in [*primary, *secondary]:
        if publication_id in seen:
            continue
        seen.add(publication_id)
        merged.append(publication_id)
        if len(merged) >= limit:
            break
    return merged


def _filter_available_books(app_state: AppState, publication_ids: list[int], limit: int) -> list[int]:
    if not publication_ids:
        return []

    with _pooled_connection(app_state) as conn:
        with conn.cursor() as cur:
            cur.execute("SET LOCAL statement_timeout = %s", (app_state.settings.statement_timeout_ms,))
            cur.execute(
                """
                SELECT p.id
                FROM public.publications p
                WHERE p.id = ANY(%s)
                  AND EXISTS (
                      SELECT 1
                      FROM public.items i
                      WHERE i.publication_id = p.id
                        AND i.status = 'AVAILABLE'
                  )
                """,
                (publication_ids,),
            )
            available_ids = {int(row[0]) for row in cur.fetchall()}

    ranked = [pid for pid in publication_ids if pid in available_ids]
    return ranked[:limit]


def _get_trending_books(app_state: AppState, limit: int) -> list[int]:
    with _pooled_connection(app_state) as conn:
        with conn.cursor() as cur:
            cur.execute("SET LOCAL statement_timeout = %s", (app_state.settings.statement_timeout_ms,))
            cur.execute(
                """
                WITH interaction_scores AS (
                    SELECT
                        publication_id,
                        SUM(
                            CASE type
                                WHEN 'WATCH' THEN 1
                                WHEN 'WISHLIST' THEN 5
                                WHEN 'BORROWED' THEN 10
                                ELSE 0
                            END
                        ) AS score
                    FROM public.user_interactions
                    GROUP BY publication_id
                ),
                borrow_scores AS (
                    SELECT i.publication_id, COUNT(*) * 8 AS score
                    FROM public.borrowing_transactions bt
                    JOIN public.items i ON i.id = bt.item_id
                    GROUP BY i.publication_id
                ),
                rating_scores AS (
                    SELECT publication_id, AVG(star) * 3 + COUNT(*) AS score
                    FROM public.ratings
                    GROUP BY publication_id
                )
                SELECT p.id
                FROM public.publications p
                LEFT JOIN interaction_scores ix ON ix.publication_id = p.id
                LEFT JOIN borrow_scores bs ON bs.publication_id = p.id
                LEFT JOIN rating_scores rs ON rs.publication_id = p.id
                WHERE EXISTS (
                    SELECT 1
                    FROM public.items i
                    WHERE i.publication_id = p.id
                      AND i.status = 'AVAILABLE'
                )
                ORDER BY
                    COALESCE(ix.score, 0)
                    + COALESCE(bs.score, 0)
                    + COALESCE(rs.score, 0) DESC,
                    p.created_at DESC NULLS LAST,
                    p.id ASC
                LIMIT %s
                """,
                (limit,),
            )
            return [int(row[0]) for row in cur.fetchall()]


def _normalize_search_text(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value.lower())
    without_marks = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    without_marks = without_marks.replace("đ", "d")
    without_marks = re.sub(r"[^a-z0-9+#]+", " ", without_marks)
    return " ".join(without_marks.split())


def _tokenize_search_text(value: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", _normalize_search_text(value))


_QUERY_TERM_STOPWORDS = {
    "cac",
    "can",
    "cho",
    "cua",
    "duoc",
    "hoc",
    "kiem",
    "minh",
    "mot",
    "muon",
    "nhung",
    "sach",
    "tai",
    "tap",
    "the",
    "tim",
    "trong",
    "voi",
}


def _meaningful_query_terms(query_text: str) -> list[str]:
    return [
        term for term in _tokenize_search_text(query_text)
        if len(term) >= 3 and term not in _QUERY_TERM_STOPWORDS
    ]


_QUERY_EXPANSIONS: dict[str, tuple[str, ...]] = {
    "tri tue nhan tao": ("artificial intelligence", "ai"),
    "hoc may": ("machine learning",),
    "hoc sau": ("deep learning",),
    "mang no ron": ("neural network", "neural networks"),
    "xu ly ngon ngu tu nhien": ("natural language processing", "nlp"),
    "thi giac may tinh": ("computer vision",),
    "co so du lieu": ("database", "databases"),
    "lap trinh web": ("web development",),
    "backend": (
        "back end",
        "server side",
        "server-side",
        "backend development",
        "api",
        "rest api",
        "node js",
        "node.js",
        "express",
        "mongodb",
        "full stack",
        "web development",
    ),
    "back end": (
        "backend",
        "server side",
        "api",
        "rest api",
        "node js",
        "full stack",
        "web development",
    ),
    "full stack": (
        "full-stack",
        "web development",
        "frontend",
        "backend",
        "react",
        "node js",
        "node.js",
        "mongodb",
        "graphql",
    ),
    "thuat toan": ("algorithm", "algorithms"),
    "cau truc du lieu": ("data structures",),
    "duoc ly": ("pharmacology", "drug action", "drug therapy", "clinical pharmacology"),
    "duoc hoc": ("pharmacy", "pharmaceutical science", "pharmaceutics"),
    "hoa duoc": ("medicinal chemistry", "pharmaceutical chemistry"),
    "y hoc": ("medicine", "medical science", "clinical medicine"),
    "sinh ly": ("physiology",),
    "sinh hoa": ("biochemistry",),
}


def _expanded_search_phrases(query_text: str) -> list[str]:
    query = _normalize_search_text(query_text)
    phrases = [query] if query else []
    for source, expansions in _QUERY_EXPANSIONS.items():
        if source in query:
            phrases.extend(_normalize_search_text(expansion) for expansion in expansions)
    if query in {"ai", "a i"}:
        phrases.extend(["artificial intelligence", "tri tue nhan tao"])

    result: list[str] = []
    seen: set[str] = set()
    for phrase in phrases:
        phrase = _normalize_search_text(phrase)
        if phrase and phrase not in seen:
            result.append(phrase)
            seen.add(phrase)
    return result


def _metadata_relevance_score(query_text: str, fields: dict[str, str]) -> int:
    phrases = _expanded_search_phrases(query_text)
    if not phrases:
        return 0

    title = _normalize_search_text(fields.get("title", ""))
    subtitle = _normalize_search_text(fields.get("subtitle", ""))
    description = _normalize_search_text(fields.get("description", ""))
    summary = _normalize_search_text(fields.get("summary", ""))
    authors = _normalize_search_text(fields.get("authors", ""))
    categories = _normalize_search_text(fields.get("categories", ""))
    tags = _normalize_search_text(fields.get("tags", ""))

    score = 0
    for phrase in phrases:
        if phrase in title:
            score += 90 if phrase == title else 80
        if phrase in subtitle:
            score += 45
        if phrase in categories:
            score += 42
        if phrase in tags:
            score += 38
        if phrase in description:
            score += 22
        if phrase in summary:
            score += 16
        if phrase in authors:
            score += 8

    query_terms = set(_meaningful_query_terms(query_text))
    if not query_terms:
        return score

    field_weights = (
        (title, 10),
        (subtitle, 6),
        (categories, 6),
        (tags, 5),
        (description, 3),
        (summary, 2),
        (authors, 1),
    )
    for field_text, weight in field_weights:
        terms = set(_tokenize_search_text(field_text))
        score += weight * len(query_terms.intersection(terms))

    return score


def _keyword_fallback_search(app_state: AppState, query_text: str, limit: int) -> list[int]:
    phrases = _expanded_search_phrases(query_text)
    with _pooled_connection(app_state) as conn:
        with conn.cursor() as cur:
            cur.execute("SET LOCAL statement_timeout = %s", (app_state.settings.statement_timeout_ms,))
            cur.execute(
                """
                SELECT
                    p.id,
                    p.title,
                    p.subtitle,
                    p.description,
                    p.ai_summary,
                    STRING_AGG(DISTINCT a.name, ' ') AS authors,
                    STRING_AGG(DISTINCT c.name, ' ') AS categories,
                    STRING_AGG(DISTINCT t.name, ' ') AS tags
                FROM public.publications p
                LEFT JOIN public.publication_authors pa ON pa.publication_id = p.id
                LEFT JOIN public.authors a ON a.id = pa.author_id
                LEFT JOIN public.publication_categories pc ON pc.publication_id = p.id
                LEFT JOIN public.categories c ON c.id = pc.category_id
                LEFT JOIN public.publication_tags pt ON pt.publication_id = p.id
                LEFT JOIN public.tags t ON t.id = pt.tag_id
                GROUP BY p.id
                ORDER BY p.created_at DESC NULLS LAST, p.id ASC
                LIMIT 1000
                """
            )
            rows = cur.fetchall()

    if not phrases:
        return []

    scored: list[tuple[int, int, int]] = []
    for rank, row in enumerate(rows):
        publication_id = int(row[0])
        fields = {
            "title": str(row[1] or ""),
            "subtitle": str(row[2] or ""),
            "description": str(row[3] or ""),
            "summary": str(row[4] or ""),
            "authors": str(row[5] or ""),
            "categories": str(row[6] or ""),
            "tags": str(row[7] or ""),
        }
        score = _metadata_relevance_score(query_text, fields)
        if score > 0:
            scored.append((publication_id, score, rank))

    scored.sort(key=lambda item: (-item[1], item[2], item[0]))
    return [publication_id for publication_id, _score, _rank in scored[:limit]]


def _persist_recommendations(
    app_state: AppState,
    user_id: int,
    publication_ids: list[int],
    strategy: str,
) -> None:
    with _pooled_connection(app_state) as conn:
        with conn.cursor() as cur:
            cur.execute("SET LOCAL statement_timeout = %s", (app_state.settings.statement_timeout_ms,))
            cur.execute(
                """
                INSERT INTO public.ai_recommendations (user_id, pub_ids, strategy, computed_at)
                SELECT %s, %s, %s, NOW()
                WHERE EXISTS (
                    SELECT 1
                    FROM public.users
                    WHERE id = %s
                )
                ON CONFLICT (user_id)
                DO UPDATE SET
                    pub_ids = EXCLUDED.pub_ids,
                    strategy = EXCLUDED.strategy,
                    computed_at = NOW()
                """,
                (user_id, Json(publication_ids), strategy[:30], user_id),
            )
        conn.commit()


def _log_search(app_state: AppState, query_text: str, publication_ids: list[int]) -> None:
    with _pooled_connection(app_state) as conn:
        with conn.cursor() as cur:
            cur.execute("SET LOCAL statement_timeout = %s", (app_state.settings.statement_timeout_ms,))
            cur.execute(
                """
                INSERT INTO ai_engine.search_logs (query_text, publication_ids)
                VALUES (%s, %s)
                """,
                (query_text, Json(publication_ids)),
            )
        conn.commit()


def _resolve_pdf_source(app_state: AppState, request: ProcessPublicationRequest) -> str:
    if request.pdf_url:
        return request.pdf_url

    with _pooled_connection(app_state) as conn:
        return app_state.etl_database.get_publication_file_url(conn, request.publication_id)


def _mark_process_failed(app_state: AppState, publication_id: int, pdf_source: str, exc: Exception) -> None:
    file_hash = AIEtlPipeline._calculate_file_hash(pdf_source)
    with _pooled_connection(app_state) as conn:
        app_state.etl_database.ensure_etl_metadata_table(conn)
        app_state.etl_database.mark_publication_etl_failed(conn, publication_id, file_hash, str(exc))
        conn.commit()


async def _retrain_loop(app_state: AppState) -> None:
    while True:
        try:
            await app_state.recommender.train_and_persist(
                lambda: _pooled_connection(app_state),
            )
        except Exception:
            # Retry in next cycle to keep API available even if retrain fails.
            pass

        await asyncio.sleep(app_state.settings.als_retrain_interval_seconds)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = load_api_settings()
    etl_settings = load_etl_settings()
    db_pool = DatabaseConnectionPool(
        database_url=settings.database_url,
        minconn=settings.db_pool_minconn,
        maxconn=settings.db_pool_maxconn,
    )
    embedding_model = SentenceTransformer(settings.embedding_model_name)
    recommender = RecommenderEngine(settings)
    etl_database = Database(etl_settings.database_url)
    llm_client = GeminiClient(
        api_key=etl_settings.gemini_api_key,
        cheap_model=etl_settings.gemini_model_cheap,
        premium_model=etl_settings.gemini_model_premium,
        timeout_seconds=etl_settings.llm_timeout_seconds,
        retry_attempts=etl_settings.llm_retry_attempts,
        min_request_interval_seconds=etl_settings.gemini_min_request_interval_seconds,
    )
    etl_pipeline = AIEtlPipeline(
        settings=etl_settings,
        database=etl_database,
        llm_client=llm_client,
        embedding_client=_SharedEmbeddingClient(embedding_model),
    )

    app_state = AppState(
        settings=settings,
        etl_settings=etl_settings,
        db_pool=db_pool,
        etl_database=etl_database,
        etl_pipeline=etl_pipeline,
        embedding_model=embedding_model,
        recommender=recommender,
    )

    embedding_model.encode("library search warmup", normalize_embeddings=True)
    await recommender.load_or_train(lambda: _pooled_connection(app_state))
    app_state.retrain_task = asyncio.create_task(_retrain_loop(app_state))

    app.state.ctx = app_state

    try:
        yield
    finally:
        if app_state.retrain_task is not None:
            app_state.retrain_task.cancel()
            try:
                await app_state.retrain_task
            except asyncio.CancelledError:
                pass
        db_pool.close()


app = FastAPI(title="LMS AI Gateway", version="1.0.0", lifespan=lifespan)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post(
    "/api/v1/publications/process",
    response_model=ProcessPublicationResponse,
    response_class=JSONResponse,
)
def process_publication(request: ProcessPublicationRequest) -> ProcessPublicationResponse:
    app_state: AppState = app.state.ctx
    pdf_source = _resolve_pdf_source(app_state, request)

    try:
        result = app_state.etl_pipeline.run(
            publication_id=request.publication_id,
            pdf_path=pdf_source,
            force_reprocess=request.force_reprocess,
        )
        output = {}
        if bool(result.get("skipped", False)):
            with _pooled_connection(app_state) as conn:
                output = app_state.etl_database.get_publication_ai_outputs(conn, request.publication_id)
        return ProcessPublicationResponse(
            publication_id=request.publication_id,
            status="SUCCESS",
            skipped=bool(result.get("skipped", False)),
            chunks=int(result.get("chunks", 0)),
            vectors=int(result.get("vectors", 0)),
            summary_generated=bool(result.get("master_summary") or output.get("ai_summary")),
            tags=[str(tag) for tag in (result.get("tags") or output.get("tags") or [])],
            ai_target_audience=(
                str(result.get("audience"))
                if result.get("audience")
                else str(output.get("ai_target_audience"))
                if output.get("ai_target_audience")
                else None
            ),
            error=(
                str(result.get("metadata_fallback_reason"))
                if result.get("metadata_fallback_reason")
                else None
            ),
        )
    except Exception as exc:
        try:
            _mark_process_failed(app_state, request.publication_id, pdf_source, exc)
        except Exception:
            pass
        raise HTTPException(
            status_code=500,
            detail=f"Publication processing failed: {exc}",
        ) from exc


@app.post(
    "/api/v1/publications/vectorize",
    response_model=VectorizePublicationResponse,
    response_class=JSONResponse,
)
def vectorize_publication(request: ProcessPublicationRequest) -> VectorizePublicationResponse:
    app_state: AppState = app.state.ctx
    pdf_source = _resolve_pdf_source(app_state, request)
    file_hash = AIEtlPipeline._calculate_file_hash(pdf_source)

    try:
        with _pooled_connection(app_state) as conn:
            app_state.etl_database.ensure_etl_metadata_table(conn)
            app_state.etl_database.mark_publication_etl_running(conn, request.publication_id, file_hash)
            conn.commit()

        full_text = extract_pdf_text(
            pdf_source,
            enable_ocr_fallback=app_state.etl_settings.enable_ocr_fallback,
            ocr_max_pages=app_state.etl_settings.ocr_max_pages,
            ocr_dpi=app_state.etl_settings.ocr_dpi,
            ocr_language=app_state.etl_settings.ocr_language,
            ocr_min_text_chars=app_state.etl_settings.ocr_min_text_chars,
        )
        chunks = sliding_window_chunk(
            text=full_text,
            chunk_size=app_state.etl_settings.chunk_size,
            overlap=app_state.etl_settings.chunk_overlap,
        )
        if not chunks:
            raise ValueError("No valid text chunks extracted from PDF")

        chunk_texts = [chunk.text for chunk in chunks]
        vectors = app_state.etl_pipeline.embedding_client.encode(chunk_texts)

        with _pooled_connection(app_state) as conn:
            app_state.etl_database.clear_publication_vectors(conn, request.publication_id)
            vector_rows = list(zip(chunk_texts, vectors))
            for start in range(0, len(vector_rows), app_state.etl_settings.vector_insert_batch_size):
                batch_rows = vector_rows[start : start + app_state.etl_settings.vector_insert_batch_size]
                app_state.etl_database.bulk_insert_vectors(conn, request.publication_id, batch_rows)
            app_state.etl_database.upsert_publication_file_hash(
                conn,
                request.publication_id,
                file_hash,
                chunks_count=len(chunks),
                vectors_count=len(vectors),
            )
            conn.commit()

        return VectorizePublicationResponse(
            publication_id=request.publication_id,
            status="SUCCESS",
            chunks=len(chunks),
            vectors=len(vectors),
        )
    except Exception as exc:
        try:
            _mark_process_failed(app_state, request.publication_id, pdf_source, exc)
        except Exception:
            pass
        raise HTTPException(
            status_code=500,
            detail=f"Publication vectorization failed: {exc}",
        ) from exc


@app.post(
    "/api/v1/publications/metadata",
    response_model=MetadataPublicationResponse,
    response_class=JSONResponse,
)
def generate_publication_metadata(request: ProcessPublicationRequest) -> MetadataPublicationResponse:
    app_state: AppState = app.state.ctx
    pdf_source = _resolve_pdf_source(app_state, request)
    file_hash = AIEtlPipeline._calculate_file_hash(pdf_source)

    try:
        with _pooled_connection(app_state) as conn:
            app_state.etl_database.ensure_etl_metadata_table(conn)
            app_state.etl_database.mark_publication_etl_running(conn, request.publication_id, file_hash)
            conn.commit()

            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, chunk_text, embedding
                    FROM ai_engine.publication_vectors
                    WHERE publication_id = %s
                    ORDER BY id ASC
                    """,
                    (request.publication_id,),
                )
                rows = cur.fetchall()

        chunks = [Chunk(chunk_id=str(row[0]), text=str(row[1])) for row in rows if str(row[1]).strip()]
        vectors = [_pg_vector_to_list(row[2]) for row in rows if str(row[1]).strip()]
        if not chunks or not vectors:
            raise ValueError("Publication has no vector chunks. Run vectorization first.")

        representative_chunks = app_state.etl_pipeline._select_representative_chunks(  # noqa: SLF001
            chunks=chunks,
            vectors=vectors,
            max_chunks=app_state.etl_settings.reduce_max_chunks,
        )
        reduce_inputs = app_state.etl_pipeline._apply_reduce_budget(representative_chunks)  # noqa: SLF001
        if not reduce_inputs:
            raise ValueError("No representative chunks available for metadata generation")

        with _pooled_connection(app_state) as conn:
            publication_context = app_state.etl_database.get_publication_context(conn, request.publication_id)

        reduce_result = app_state.etl_pipeline._reduce_with_fallback(reduce_inputs, publication_context)  # noqa: SLF001
        tags = [str(tag) for tag in reduce_result["tags"]]

        with _pooled_connection(app_state) as conn:
            app_state.etl_database.clear_publication_metadata(conn, request.publication_id)
            app_state.etl_database.update_publication_summary(
                conn,
                request.publication_id,
                str(reduce_result["master_summary"]),
                str(reduce_result["audience"]),
            )
            tag_ids = [
                app_state.etl_database.find_or_create_tag_id(conn, tag_name)
                for tag_name in tags
            ]
            app_state.etl_database.insert_publication_tag_links(conn, request.publication_id, tag_ids)
            app_state.etl_database.upsert_tag_translations(
                conn,
                tag_ids=tag_ids,
                translated_names=[str(tag) for tag in reduce_result.get("tags_en", [])],
                language_code="en",
            )
            app_state.etl_database.upsert_publication_file_hash(
                conn,
                request.publication_id,
                file_hash,
                chunks_count=len(chunks),
                vectors_count=len(vectors),
            )
            conn.commit()

        return MetadataPublicationResponse(
            publication_id=request.publication_id,
            status="SUCCESS",
            reduce_inputs=len(reduce_inputs),
            summary_generated=True,
            tags=tags,
            ai_target_audience=str(reduce_result["audience"]),
            error=str(reduce_result["fallback_reason"]) if reduce_result.get("fallback_reason") else None,
        )
    except Exception as exc:
        try:
            _mark_process_failed(app_state, request.publication_id, pdf_source, exc)
        except Exception:
            pass
        raise HTTPException(
            status_code=500,
            detail=f"Publication metadata generation failed: {exc}",
        ) from exc


@app.post("/api/v1/semantic-search", response_model=SemanticSearchResponse)
def semantic_search(request: SemanticSearchRequest) -> SemanticSearchResponse:
    app_state: AppState = app.state.ctx
    limit = min(
        request.limit or app_state.settings.default_search_limit,
        app_state.settings.max_search_limit,
    )

    try:
        keyword_ids = _keyword_fallback_search(app_state, request.query_text, limit)
        chunk_keyword_ids = _chunk_keyword_search(app_state, request.query_text, limit)

        if _has_publication_vectors(app_state):
            vector = app_state.embedding_model.encode(request.query_text, normalize_embeddings=True)
            semantic_ids = _semantic_search_publication_ids(
                app_state,
                vector.tolist(),
                limit,
                min_similarity=app_state.settings.search_strict_min_similarity,
            )
        else:
            semantic_ids = []

        publication_ids = _merge_ranked_unique(
            _merge_ranked_unique(keyword_ids, chunk_keyword_ids, limit),
            semantic_ids,
            limit,
        )

        _log_search(app_state, request.query_text, publication_ids)
        return SemanticSearchResponse(publication_ids=publication_ids)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Semantic search failed: {exc}") from exc


@app.get("/api/v1/publications/{publication_id}/similar", response_model=SimilarPublicationsResponse)
def similar_publications(publication_id: int, limit: int = 6) -> SimilarPublicationsResponse:
    app_state: AppState = app.state.ctx
    safe_limit = min(max(limit, 1), app_state.settings.max_recommend_limit)

    try:
        publication_ids = _similar_publication_ids(app_state, publication_id, safe_limit)
        if len(publication_ids) < safe_limit:
            trending_ids = _get_trending_books(app_state, safe_limit)
            publication_ids = _merge_ranked_unique(publication_ids, trending_ids, safe_limit)
        return SimilarPublicationsResponse(publication_ids=publication_ids)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Similar publication search failed: {exc}") from exc


@app.post("/api/v1/recommendations", response_model=RecommendationResponse)
async def recommendations(request: RecommendationRequest) -> RecommendationResponse:
    app_state: AppState = app.state.ctx
    limit = min(
        request.limit or app_state.settings.default_recommend_limit,
        app_state.settings.max_recommend_limit,
    )

    try:
        has_interactions = _has_user_interactions(app_state, request.user_id)
        if not has_interactions:
            publication_ids = _get_trending_books(app_state, limit)
            _persist_recommendations(app_state, request.user_id, publication_ids, "TRENDING_FALLBACK")
            return RecommendationResponse(publication_ids=publication_ids, strategy="TRENDING_FALLBACK")

        cbf_ids = _content_based_recommendations(app_state, request.user_id, limit)
        try:
            raw_recommendations = await app_state.recommender.recommend_for_user(
                user_id=request.user_id,
                limit=limit,
            )
        except Exception:
            raw_recommendations = []
        als_ids = _filter_available_books(app_state, raw_recommendations, limit) if raw_recommendations else []
        publication_ids = _merge_ranked_unique(cbf_ids, als_ids, limit)

        metadata_ids: list[int] = []
        if len(publication_ids) < limit:
            try:
                metadata_ids = _metadata_based_recommendations(
                    app_state,
                    request.user_id,
                    limit,
                    exclude_publication_ids=publication_ids,
                )
            except Exception:
                metadata_ids = []
            publication_ids = _merge_ranked_unique(publication_ids, metadata_ids, limit)

        if len(publication_ids) < limit:
            trending_ids = _get_trending_books(app_state, limit)
            publication_ids = _merge_ranked_unique(publication_ids, trending_ids, limit)

        if not publication_ids:
            _persist_recommendations(app_state, request.user_id, [], "TRENDING_FALLBACK")
            return RecommendationResponse(publication_ids=[], strategy="TRENDING_FALLBACK")

        if cbf_ids and als_ids:
            strategy = "REALTIME_CBF_ALS_HYBRID"
        elif cbf_ids:
            strategy = "REALTIME_CONTENT_BASED"
        elif als_ids:
            strategy = "ALS_HYBRID"
        elif metadata_ids:
            strategy = "METADATA_BASED"
        else:
            strategy = "TRENDING_FALLBACK"

        _persist_recommendations(app_state, request.user_id, publication_ids, strategy)
        return RecommendationResponse(publication_ids=publication_ids, strategy=strategy)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {exc}") from exc


@app.post("/api/v1/recommendations/refresh", response_model=RecommendationResponse)
async def refresh_recommendations(request: RefreshRecommendationRequest) -> RecommendationResponse:
    return await recommendations(RecommendationRequest(user_id=request.user_id, limit=request.limit))
