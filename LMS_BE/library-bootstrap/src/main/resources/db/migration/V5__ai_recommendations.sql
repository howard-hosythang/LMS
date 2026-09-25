CREATE TABLE ai_recommendations (
    user_id     BIGINT       PRIMARY KEY REFERENCES users(id),
    pub_ids     JSONB        NOT NULL DEFAULT '[]',
    strategy    VARCHAR(30)  NOT NULL DEFAULT 'TRENDING_FALLBACK',
    computed_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_recommendations_computed_at ON ai_recommendations(computed_at);
