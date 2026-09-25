from __future__ import annotations

import asyncio
from types import SimpleNamespace

import api_service


class FakeEmbeddingModel:
    def encode(self, query_text: str, normalize_embeddings: bool = True):
        assert normalize_embeddings is True
        return SimpleNamespace(tolist=lambda: [0.1, 0.2, 0.3])


class FakeRecommender:
    async def recommend_for_user(self, user_id: int, limit: int) -> list[int]:
        assert user_id == 99
        assert limit == 5
        return [30, 31, 32]


def _install_app_state(settings=None) -> SimpleNamespace:
    state = SimpleNamespace(
        settings=settings or SimpleNamespace(
            default_search_limit=10,
            max_search_limit=50,
            search_strict_min_similarity=0.68,
            default_recommend_limit=10,
            max_recommend_limit=50,
        ),
        embedding_model=FakeEmbeddingModel(),
        recommender=FakeRecommender(),
    )
    api_service.app.state.ctx = state
    return state


def test_vector_to_pg_literal_uses_fixed_precision_for_pgvector_cast() -> None:
    assert api_service._vector_to_pg_literal([1, 0.125, -2.5]) == "[1.0000000000,0.1250000000,-2.5000000000]"


def test_query_tokenization_is_accent_insensitive_and_filters_short_terms() -> None:
    assert api_service._meaningful_query_terms("Lập trình AI, C++ và Web") == ["lap", "trinh", "web"]
    assert api_service._expanded_search_phrases("Trí tuệ nhân tạo") == [
        "tri tue nhan tao",
        "artificial intelligence",
        "ai",
    ]
    assert "pharmacology" in api_service._expanded_search_phrases("Dược lý")
    assert "node js" in api_service._expanded_search_phrases("mình muốn học backend")
    assert api_service._meaningful_query_terms("mình muốn học backend") == ["backend"]


def test_metadata_relevance_ranks_exact_translated_title_above_broad_ai_category() -> None:
    query = "Trí Tuệ Nhân Tạo"
    aima_score = api_service._metadata_relevance_score(
        query,
        {
            "title": "Artificial Intelligence: A Modern Approach",
            "authors": "Peter Norvig, Stuart Russell",
            "categories": "Trí Tuệ Nhân Tạo",
            "description": "A comprehensive AI textbook.",
            "summary": "",
            "tags": "",
        },
    )
    machine_learning_score = api_service._metadata_relevance_score(
        query,
        {
            "title": "Machine Learning cơ bản",
            "authors": "Vũ Khắc Tiệp",
            "categories": "Trí Tuệ Nhân Tạo",
            "description": "Machine learning foundations.",
            "summary": "",
            "tags": "",
        },
    )

    assert aima_score > machine_learning_score


def test_pharmacology_query_does_not_match_common_vietnamese_duoc_word() -> None:
    score = api_service._metadata_relevance_score(
        "dược lý",
        {
            "title": "Full Stack Open",
            "authors": "Matti Luukkainen",
            "categories": "Lập Trình Web",
            "description": "Được dùng trong chương trình đại học về React, Node.js và GraphQL.",
            "summary": "",
            "tags": "Lập Trình",
        },
    )

    assert score == 0


def test_backend_intent_ranks_full_stack_metadata_above_broad_cs_overview() -> None:
    query = "mình muốn học backend"
    full_stack_score = api_service._metadata_relevance_score(
        query,
        {
            "title": "Full Stack Open",
            "authors": "University of Helsinki",
            "categories": "Lập Trình Web",
            "description": "Khóa học full-stack miễn phí: React, Redux, Node.js, MongoDB, TypeScript, GraphQL.",
            "summary": "",
            "tags": "Lập Trình Web",
        },
    )
    overview_score = api_service._metadata_relevance_score(
        query,
        {
            "title": "Computer Science Illuminated",
            "authors": "Nell Dale",
            "categories": "Công Nghệ Thông Tin, Khoa Học Máy Tính Cơ Bản",
            "description": "Cái nhìn tổng quan về khoa học máy tính, phần cứng, hệ điều hành, mạng và bảo mật.",
            "summary": "",
            "tags": "",
        },
    )

    assert full_stack_score > 0
    assert full_stack_score > overview_score


def test_merge_ranked_unique_preserves_rank_and_limit() -> None:
    assert api_service._merge_ranked_unique([1, 2, 3], [3, 4, 5], limit=4) == [1, 2, 3, 4]


def test_semantic_search_prefers_lexical_results_for_short_queries(monkeypatch) -> None:
    _install_app_state()
    log_calls: list[tuple[str, list[int]]] = []
    semantic_calls: list[float | None] = []

    monkeypatch.setattr(api_service, "_has_publication_vectors", lambda _state: True)
    monkeypatch.setattr(
        api_service,
        "_semantic_search_publication_ids",
        lambda _state, _vector, _limit, min_similarity=None: semantic_calls.append(min_similarity) or [8, 9],
    )
    monkeypatch.setattr(api_service, "_keyword_fallback_search", lambda _state, _query, _limit: [1, 2, 8])
    monkeypatch.setattr(api_service, "_chunk_keyword_search", lambda _state, _query, _limit: [3, 2])
    monkeypatch.setattr(api_service, "_log_search", lambda _state, query, ids: log_calls.append((query, ids)))

    response = api_service.semantic_search(api_service.SemanticSearchRequest(query_text="web development", limit=5))

    assert response.publication_ids == [1, 2, 8, 3, 9]
    assert log_calls == [("web development", [1, 2, 8, 3, 9])]
    assert semantic_calls == [0.68]


def test_semantic_search_requires_strict_vector_match_without_lexical_signal(monkeypatch) -> None:
    _install_app_state()
    thresholds: list[float | None] = []

    def fake_semantic(_state, _vector, _limit, min_similarity=None):
        thresholds.append(min_similarity)
        return []

    monkeypatch.setattr(api_service, "_has_publication_vectors", lambda _state: True)
    monkeypatch.setattr(api_service, "_semantic_search_publication_ids", fake_semantic)
    monkeypatch.setattr(api_service, "_keyword_fallback_search", lambda _state, _query, _limit: [])
    monkeypatch.setattr(api_service, "_chunk_keyword_search", lambda _state, _query, _limit: [])
    monkeypatch.setattr(api_service, "_log_search", lambda *_args: None)

    response = api_service.semantic_search(api_service.SemanticSearchRequest(query_text="dược lý", limit=5))

    assert response.publication_ids == []
    assert thresholds == [0.68]


def test_semantic_search_keeps_keyword_first_for_long_queries(monkeypatch) -> None:
    _install_app_state()

    monkeypatch.setattr(api_service, "_has_publication_vectors", lambda _state: True)
    monkeypatch.setattr(
        api_service,
        "_semantic_search_publication_ids",
        lambda _state, _vector, _limit, min_similarity=None: [40, 41],
    )
    monkeypatch.setattr(api_service, "_keyword_fallback_search", lambda _state, _query, _limit: [1, 40])
    monkeypatch.setattr(api_service, "_chunk_keyword_search", lambda _state, _query, _limit: [30, 31])
    monkeypatch.setattr(api_service, "_log_search", lambda *_args: None)

    response = api_service.semantic_search(
        api_service.SemanticSearchRequest(query_text="advanced neural information retrieval systems", limit=5)
    )

    assert response.publication_ids == [1, 40, 30, 31, 41]


def test_semantic_search_caps_requested_limit_to_configured_max(monkeypatch) -> None:
    settings = SimpleNamespace(
        default_search_limit=10,
        max_search_limit=3,
        search_strict_min_similarity=0.68,
        default_recommend_limit=10,
        max_recommend_limit=50,
    )
    _install_app_state(settings)
    downstream_limits: list[int] = []

    monkeypatch.setattr(api_service, "_has_publication_vectors", lambda _state: True)
    monkeypatch.setattr(
        api_service,
        "_semantic_search_publication_ids",
        lambda _state, _vector, limit, min_similarity=None: downstream_limits.append(limit) or [8, 9, 10, 11],
    )
    monkeypatch.setattr(
        api_service,
        "_keyword_fallback_search",
        lambda _state, _query, limit: downstream_limits.append(limit) or [1, 2, 3, 4],
    )
    monkeypatch.setattr(
        api_service,
        "_chunk_keyword_search",
        lambda _state, _query, limit: downstream_limits.append(limit) or [5, 6, 7, 8],
    )
    monkeypatch.setattr(api_service, "_log_search", lambda *_args: None)

    response = api_service.semantic_search(api_service.SemanticSearchRequest(query_text="web", limit=100))

    assert downstream_limits == [3, 3, 3]
    assert response.publication_ids == [1, 2, 3]


def test_recommendations_use_trending_fallback_for_cold_start_users(monkeypatch) -> None:
    _install_app_state()
    persisted: list[tuple[int, list[int], str]] = []

    monkeypatch.setattr(api_service, "_has_user_interactions", lambda _state, user_id: False)
    monkeypatch.setattr(api_service, "_get_trending_books", lambda _state, limit: [10, 11, 12][:limit])
    monkeypatch.setattr(
        api_service,
        "_persist_recommendations",
        lambda _state, user_id, ids, strategy: persisted.append((user_id, ids, strategy)),
    )

    response = asyncio.run(api_service.recommendations(api_service.RecommendationRequest(user_id=99, limit=3)))

    assert response.publication_ids == [10, 11, 12]
    assert response.strategy == "TRENDING_FALLBACK"
    assert persisted == [(99, [10, 11, 12], "TRENDING_FALLBACK")]


def test_recommendations_merge_cbf_als_and_trending_for_warm_users(monkeypatch) -> None:
    _install_app_state()
    persisted: list[tuple[int, list[int], str]] = []

    monkeypatch.setattr(api_service, "_has_user_interactions", lambda _state, user_id: True)
    monkeypatch.setattr(api_service, "_content_based_recommendations", lambda _state, user_id, limit: [20, 21])
    monkeypatch.setattr(api_service, "_filter_available_books", lambda _state, ids, limit: [30, 31])
    monkeypatch.setattr(api_service, "_get_trending_books", lambda _state, limit: [21, 40, 41, 42])
    monkeypatch.setattr(
        api_service,
        "_persist_recommendations",
        lambda _state, user_id, ids, strategy: persisted.append((user_id, ids, strategy)),
    )

    response = asyncio.run(api_service.recommendations(api_service.RecommendationRequest(user_id=99, limit=5)))

    assert response.publication_ids == [20, 21, 30, 31, 40]
    assert response.strategy == "REALTIME_CBF_ALS_HYBRID"
    assert persisted == [(99, [20, 21, 30, 31, 40], "REALTIME_CBF_ALS_HYBRID")]


def test_recommendations_fall_back_when_als_recommender_fails(monkeypatch) -> None:
    class FailingRecommender:
        async def recommend_for_user(self, user_id: int, limit: int) -> list[int]:
            raise RuntimeError("ALS model unavailable")

    state = _install_app_state()
    state.recommender = FailingRecommender()
    persisted: list[tuple[int, list[int], str]] = []

    monkeypatch.setattr(api_service, "_has_user_interactions", lambda _state, user_id: True)
    monkeypatch.setattr(api_service, "_content_based_recommendations", lambda _state, user_id, limit: [20])
    monkeypatch.setattr(api_service, "_get_trending_books", lambda _state, limit: [30, 31, 32][:limit])
    monkeypatch.setattr(
        api_service,
        "_persist_recommendations",
        lambda _state, user_id, ids, strategy: persisted.append((user_id, ids, strategy)),
    )

    response = asyncio.run(api_service.recommendations(api_service.RecommendationRequest(user_id=99, limit=3)))

    assert response.publication_ids == [20, 30, 31]
    assert response.strategy == "REALTIME_CONTENT_BASED"
    assert persisted == [(99, [20, 30, 31], "REALTIME_CONTENT_BASED")]
