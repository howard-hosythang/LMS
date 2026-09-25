from __future__ import annotations

import asyncio
from pathlib import Path
from types import SimpleNamespace

from scipy.sparse import csr_matrix

from ai_gateway.recommender import RecommenderBundle, RecommenderEngine


class FakeCursor:
    def __init__(self) -> None:
        self.statements: list[tuple[str, tuple | None]] = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def execute(self, sql: str, params: tuple | None = None) -> None:
        self.statements.append((sql, params))

    def fetchall(self):
        return [(1, 101, 16.0), (1, 102, 1.0), (2, 103, 5.0)]


class FakeConnection:
    def __init__(self, cursor: FakeCursor) -> None:
        self.cursor_obj = cursor

    def cursor(self) -> FakeCursor:
        return self.cursor_obj


class FakeAlsModel:
    def recommend(self, userid, user_items, N, filter_already_liked_items, recalculate_user):
        assert userid == 0
        assert N == 9
        assert filter_already_liked_items is True
        assert recalculate_user is True
        return [2, 1, 0], [0.9, 0.8, 0.7]


def _settings(**overrides):
    values = dict(
        als_model_path=Path("/tmp/nonexistent-lms-ai-als.pkl"),
        als_factors=16,
        als_regularization=0.05,
        als_iterations=7,
        als_alpha=20.0,
        statement_timeout_ms=3000,
    )
    values.update(overrides)
    return SimpleNamespace(**values)


def test_bundle_matches_training_settings() -> None:
    engine = RecommenderEngine(_settings())
    bundle = RecommenderBundle(
        model=FakeAlsModel(),
        user_id_to_idx={},
        idx_to_user_id=[],
        item_id_to_idx={},
        idx_to_item_id=[],
        user_items_csr=csr_matrix((0, 0)),
        als_factors=16,
        als_regularization=0.05,
        als_iterations=7,
        als_alpha=20.0,
    )

    assert engine._bundle_matches_settings(bundle) is True

    changed_engine = RecommenderEngine(_settings(als_iterations=8))
    assert changed_engine._bundle_matches_settings(bundle) is False


def test_fetch_weighted_interactions_uses_expected_weights_and_timeout() -> None:
    cursor = FakeCursor()
    engine = RecommenderEngine(_settings(statement_timeout_ms=1234))

    rows = engine._fetch_weighted_interactions(FakeConnection(cursor))

    assert rows == [(1, 101, 16.0), (1, 102, 1.0), (2, 103, 5.0)]
    joined_sql = "\n".join(sql for sql, _params in cursor.statements)
    assert cursor.statements[0] == ("SET LOCAL statement_timeout = %s", (1234,))
    assert "WHEN 'WATCH' THEN 1" in joined_sql
    assert "WHEN 'WISHLIST' THEN 5" in joined_sql
    assert "WHEN 'BORROWED' THEN 10" in joined_sql
    assert "GROUP BY user_id, publication_id" in joined_sql


def test_recommend_for_user_returns_ranked_publication_ids_from_loaded_bundle() -> None:
    engine = RecommenderEngine(_settings())
    engine._bundle = RecommenderBundle(
        model=FakeAlsModel(),
        user_id_to_idx={99: 0},
        idx_to_user_id=[99],
        item_id_to_idx={201: 0, 202: 1, 203: 2},
        idx_to_item_id=[201, 202, 203],
        user_items_csr=csr_matrix([[1.0, 0.0, 0.0]]),
    )

    result = asyncio.run(engine.recommend_for_user(user_id=99, limit=3))

    assert result == [203, 202, 201]


def test_recommend_for_user_returns_empty_for_cold_user_or_missing_model(tmp_path: Path) -> None:
    engine = RecommenderEngine(_settings(als_model_path=tmp_path / "missing.pkl"))

    assert asyncio.run(engine.recommend_for_user(user_id=99, limit=3)) == []

    engine._bundle = RecommenderBundle(
        model=FakeAlsModel(),
        user_id_to_idx={1: 0},
        idx_to_user_id=[1],
        item_id_to_idx={201: 0},
        idx_to_item_id=[201],
        user_items_csr=csr_matrix([[1.0]]),
    )
    assert asyncio.run(engine.recommend_for_user(user_id=99, limit=3)) == []
