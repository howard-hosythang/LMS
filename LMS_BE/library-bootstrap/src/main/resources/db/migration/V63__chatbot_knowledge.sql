-- Knowledge only. No changes to circulation, users or publication vectors.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE SCHEMA IF NOT EXISTS ai_engine;

CREATE TABLE ai_engine.chatbot_knowledge_generations (
    id UUID PRIMARY KEY,
    source_revision BIGINT NOT NULL CHECK (source_revision > 0),
    corpus_version VARCHAR(64) NOT NULL,
    model_id TEXT NOT NULL,
    pipeline_version VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX chatbot_knowledge_one_active
    ON ai_engine.chatbot_knowledge_generations(active) WHERE active;

CREATE TABLE ai_engine.chatbot_knowledge_chunks (
    generation_id UUID NOT NULL REFERENCES ai_engine.chatbot_knowledge_generations(id) ON DELETE CASCADE,
    topic_id VARCHAR(100) NOT NULL,
    language VARCHAR(2) NOT NULL CHECK (language IN ('vi', 'en')),
    chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
    title TEXT NOT NULL,
    source_path TEXT NOT NULL,
    content TEXT NOT NULL,
    input_hash VARCHAR(64) NOT NULL,
    token_count INTEGER NOT NULL CHECK (token_count > 0),
    embedding vector(768) NOT NULL,
    PRIMARY KEY (generation_id, topic_id, language, chunk_index)
);
CREATE INDEX chatbot_knowledge_language ON ai_engine.chatbot_knowledge_chunks(generation_id, language);
