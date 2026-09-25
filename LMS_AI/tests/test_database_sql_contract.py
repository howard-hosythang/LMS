from __future__ import annotations

from ai_etl import db as db_module
from ai_etl.db import Database


class RecordingCursor:
    def __init__(self, fetchone_result=None) -> None:
        self.statements: list[tuple[str, tuple | None]] = []
        self.fetchone_result = fetchone_result
        self.rowcount = 1

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def execute(self, sql: str, params: tuple | None = None) -> None:
        self.statements.append((sql, params))

    def fetchone(self):
        return self.fetchone_result


class RecordingConnection:
    def __init__(self, cursor: RecordingCursor) -> None:
        self._cursor = cursor

    def cursor(self) -> RecordingCursor:
        return self._cursor


def test_clear_previous_ai_data_deletes_vectors_and_public_tag_links() -> None:
    cursor = RecordingCursor()
    Database("postgresql://test").clear_previous_ai_data(RecordingConnection(cursor), 9)

    joined_sql = "\n".join(sql for sql, _params in cursor.statements)
    assert "DELETE FROM ai_engine.publication_vectors" in joined_sql
    assert "DELETE FROM public.publication_tags" in joined_sql
    assert "SET ai_summary = NULL" in joined_sql
    assert [params for _sql, params in cursor.statements] == [(9,), (9,), (9,)]


def test_publication_has_ai_outputs_requires_vectors_tags_summary_and_audience() -> None:
    cursor = RecordingCursor(fetchone_result=(True, True, True))

    result = Database("postgresql://test").publication_has_ai_outputs(RecordingConnection(cursor), 5)

    assert result is True
    sql = cursor.statements[0][0]
    assert "ai_engine.publication_vectors" in sql
    assert "public.publication_tags" in sql
    assert "ai_summary IS NOT NULL" in sql
    assert "ai_target_audience IS NOT NULL" in sql
    assert cursor.statements[0][1] == (5, 5, 5)


def test_find_or_create_tag_id_uses_public_tags_and_rejects_generic_tags(monkeypatch) -> None:
    database = Database("postgresql://test")
    monkeypatch.setattr(database, "_generate_bigint_id", lambda: 123456789)
    cursor = RecordingCursor(fetchone_result=(77,))

    tag_id = database.find_or_create_tag_id(RecordingConnection(cursor), "  lập   trình web!!!  ")

    assert tag_id == 77
    sql, params = cursor.statements[0]
    assert "INSERT INTO public.tags" in sql
    assert "ON CONFLICT (name) DO NOTHING" in sql
    assert params == (123456789, "Lập Trình Web", "Lập Trình Web")


def test_insert_publication_tag_links_deduplicates_before_bulk_insert(monkeypatch) -> None:
    captured = {}

    def fake_execute_values(cur, sql, rows, template):
        captured["sql"] = sql
        captured["rows"] = rows
        captured["template"] = template

    database = Database("postgresql://test")
    ids = iter([1001, 1002])
    monkeypatch.setattr(database, "_generate_bigint_id", lambda: next(ids))
    monkeypatch.setattr(db_module, "execute_values", fake_execute_values)

    database.insert_publication_tag_links(RecordingConnection(RecordingCursor()), 42, [7, 7, 8])

    assert "public.publication_tags" in captured["sql"]
    assert "WHERE NOT EXISTS" in captured["sql"]
    assert captured["rows"] == [(1001, 42, 7), (1002, 42, 8)]
    assert captured["template"] == "(%s, %s, %s)"


def test_upsert_tag_translations_writes_english_aliases_to_public_schema(monkeypatch) -> None:
    captured = {}

    def fake_execute_values(cur, sql, rows, template):
        captured["sql"] = sql
        captured["rows"] = rows
        captured["template"] = template

    monkeypatch.setattr(db_module, "execute_values", fake_execute_values)

    Database("postgresql://test").upsert_tag_translations(
        RecordingConnection(RecordingCursor()),
        tag_ids=[1, 2, 3],
        translated_names=["Web Development", "  ", "Machine Learning"],
        language_code="en",
    )

    assert "INSERT INTO public.tag_translations" in captured["sql"]
    assert "ON CONFLICT (tag_id, language_code)" in captured["sql"]
    assert captured["rows"] == [(1, "en", "Web Development"), (3, "en", "Machine Learning")]
