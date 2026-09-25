CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SCHEMA IF NOT EXISTS ai_engine;

CREATE TABLE IF NOT EXISTS ai_engine.publication_vectors (
    id BIGSERIAL PRIMARY KEY,
    publication_id BIGINT REFERENCES public.publications(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    embedding vector(768) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_publication_vectors_hnsw
ON ai_engine.publication_vectors
USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_publication_vectors_pub_id
ON ai_engine.publication_vectors(publication_id);

CREATE INDEX IF NOT EXISTS idx_publication_vectors_chunk_text_trgm
ON ai_engine.publication_vectors
USING gin (chunk_text gin_trgm_ops);

CREATE TABLE IF NOT EXISTS ai_engine.publication_etl_runs (
    publication_id BIGINT PRIMARY KEY REFERENCES public.publications(id) ON DELETE CASCADE,
    file_hash VARCHAR(64) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    error_message TEXT NULL,
    chunks_count INT NOT NULL DEFAULT 0,
    vectors_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ai_engine.publication_etl_runs
ALTER COLUMN file_hash DROP NOT NULL;

ALTER TABLE ai_engine.publication_etl_runs
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS';

ALTER TABLE ai_engine.publication_etl_runs
ADD COLUMN IF NOT EXISTS error_message TEXT NULL;

ALTER TABLE ai_engine.publication_etl_runs
ADD COLUMN IF NOT EXISTS chunks_count INT NOT NULL DEFAULT 0;

ALTER TABLE ai_engine.publication_etl_runs
ADD COLUMN IF NOT EXISTS vectors_count INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS ai_engine.search_logs (
    id BIGSERIAL PRIMARY KEY,
    query_text TEXT NOT NULL,
    publication_ids JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    user_id BIGINT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    pub_ids JSONB NOT NULL DEFAULT '[]',
    strategy VARCHAR(30) NOT NULL DEFAULT 'TRENDING_FALLBACK',
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_computed_at
ON public.ai_recommendations(computed_at);

-- Older local AI schemas created a second tag taxonomy under ai_engine.
-- The backend and frontend read public.tags/public.publication_tags, so keep one
-- authoritative tag model and drop the unused duplicate tables if they exist.
DROP TABLE IF EXISTS ai_engine.publication_tags;
DROP TABLE IF EXISTS ai_engine.tags;
DROP TABLE IF EXISTS ai_engine.recommendation_cache;
