CREATE SCHEMA IF NOT EXISTS ai_engine;

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

CREATE INDEX IF NOT EXISTS idx_publication_etl_runs_status
ON ai_engine.publication_etl_runs(status);
