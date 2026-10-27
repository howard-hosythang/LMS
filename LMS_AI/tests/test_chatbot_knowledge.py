from __future__ import annotations

import math
from types import SimpleNamespace

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

from ai_gateway.chatbot_knowledge import Document, SearchRequest, SyncRequest, create_router, prepare_text, rank_help_candidates, split_document


class FakeTokenizer:
    def encode(self, text, add_special_tokens=True, truncation=False):
        assert truncation is False
        return list(range(len(text.split()) + (2 if add_special_tokens else 0)))


class FakeModel:
    tokenizer = FakeTokenizer()
    max_seq_length = 256

    def __init__(self):
        self.encoded = []

    def encode(self, text, normalize_embeddings=True):
        assert normalize_embeddings is True
        if isinstance(text, str):
            return [1.0 / math.sqrt(768)] * 768
        self.encoded.extend(text)
        return [[1.0 / math.sqrt(768)] * 768 for _ in text]


def document(content="Sign in. Find a book. Request a loan.", language="en"):
    return Document(id="borrow", language=language, title="Borrowing instructions", content=content, source_path="/publicpage/guide")


def test_short_faq_keeps_all_text_and_counts_title_and_special_tokens():
    chunks = split_document(document(), FakeModel())
    assert len(chunks) == 1
    assert chunks[0].content == "Sign in. Find a book. Request a loan."
    assert chunks[0].tokens == len(chunks[0].model_input.split()) + 2


def test_long_documents_fit_model_and_overlap_without_losing_the_last_sentence():
    sentences = [f"Step {i} needs a reader to follow these instructions carefully." for i in range(90)]
    chunks = split_document(document(" ".join(sentences)), FakeModel())
    assert len(chunks) > 2
    assert all(c.tokens <= 224 for c in chunks)
    assert sentences[-1] in chunks[-1].content
    for sentence in sentences:
        assert any(sentence in chunk.content for chunk in chunks)
    assert chunks[0].content.split("Step ")[-1] in chunks[1].content


def test_oversized_sentence_splits_without_silent_encoder_truncation():
    text = " ".join(f"word{i}" for i in range(700))
    chunks = split_document(document(text), FakeModel())
    assert len(chunks) >= 4
    assert all(c.tokens <= 224 for c in chunks)
    assert "word699" in chunks[-1].content


def test_oversized_unbroken_input_is_rejected_instead_of_truncated():
    model = FakeModel()
    model.max_seq_length = 32
    with pytest.raises(ValueError):
        split_document(document(), model)


def test_blank_source_is_rejected_without_publishing_an_empty_document():
    with pytest.raises(ValueError):
        split_document(document(" \n \t "), FakeModel())


def test_hybrid_retrieval_recovers_exact_domain_words_with_low_semantic_score():
    candidate = {"topic_id": "lost", "title": "Report a lost or damaged book",
                 "content": "Contact a librarian to report a damaged book.", "score": .1}
    hits = rank_help_candidates("How should I report a damaged book?", [candidate])
    assert hits[0]["topic_id"] == "lost"
    assert hits[0]["lexical_score"] >= .15
    assert hits[0]["score"] == .1  # Never relabel a lexical score as cosine/confidence.


def test_hybrid_retrieval_rejects_unrelated_low_signal_and_nonfinite_scores():
    source = {"topic_id": "borrow", "title": "Borrowing", "content": "Request a loan.", "score": .01}
    assert rank_help_candidates("weather forecast tomorrow", [source]) == []
    assert rank_help_candidates("Request a loan", [{**source, "score": float("nan")}]) == []


def test_vietnamese_preprocessing_segments_words_consistently():
    processed = prepare_text("Tôi đang ở thư viện.", "vi")
    assert "thư_viện" in processed
    chunks = split_document(document("Tôi đang ở thư viện.", "vi"), FakeModel())
    assert "thư_viện" in chunks[0].model_input


@pytest.mark.parametrize("path", ["https://evil.example", "/userpage/my-books", "/api/v1/users", "/publicpage/guide?token=secret"])
def test_only_reviewed_public_help_paths_can_be_indexed(path):
    with pytest.raises(ValidationError):
        Document(id="borrow", language="en", title="Guide", content="Text", source_path=path)


def test_personal_or_arbitrary_search_arguments_are_rejected():
    with pytest.raises(ValidationError):
        SearchRequest(query="My loans", language="en", version="a" * 64, userId=7)
    with pytest.raises(ValidationError):
        SyncRequest(revision=1, version="bad", documents=[document()])


def test_internal_endpoints_reject_missing_wrong_or_unconfigured_key(monkeypatch):
    monkeypatch.setenv("CHATBOT_INTERNAL_API_KEY", "server-secret")
    calls = []
    app = FastAPI()
    app.include_router(create_router(lambda: calls.append(True)))
    with TestClient(app) as client:
        assert client.get("/internal/chatbot/knowledge/status").status_code == 403
        assert client.get("/internal/chatbot/knowledge/status", headers={"X-Chatbot-Service-Key": "wrong"}).status_code == 403
        monkeypatch.setenv("CHATBOT_INTERNAL_API_KEY", "")
        assert client.get("/internal/chatbot/knowledge/status", headers={"X-Chatbot-Service-Key": "server-secret"}).status_code == 403
    assert not calls


def test_internal_contract_returns_status_and_search_without_accepting_arbitrary_identity(monkeypatch):
    monkeypatch.setenv("CHATBOT_INTERNAL_API_KEY", "server-secret")
    store = SimpleNamespace(status=lambda: {"ready": True, "version": "a" * 64},
        search=lambda request: {"version": request.version, "hits": []})
    app = FastAPI()
    app.include_router(create_router(lambda: store))
    headers = {"X-Chatbot-Service-Key": "server-secret"}
    with TestClient(app) as client:
        assert client.get("/internal/chatbot/knowledge/status", headers=headers).json()["ready"] is True
        payload = {"query": "Borrowing", "language": "en", "version": "a" * 64}
        assert client.post("/internal/chatbot/knowledge/search", headers=headers, json=payload).status_code == 200
        assert client.post("/internal/chatbot/knowledge/search", headers=headers, json={**payload, "userId": 7}).status_code == 422


def test_provider_and_database_errors_never_leak_connection_strings_or_keys(monkeypatch):
    monkeypatch.setenv("CHATBOT_INTERNAL_API_KEY", "server-secret")
    def fail():
        raise RuntimeError("postgres://secret-user:secret-password@production/db")
    app = FastAPI()
    app.include_router(create_router(fail))
    with TestClient(app) as client:
        response = client.get("/internal/chatbot/knowledge/status", headers={"X-Chatbot-Service-Key": "server-secret"})
    assert response.status_code == 503
    assert "secret-password" not in response.text
