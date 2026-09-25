CREATE TABLE IF NOT EXISTS rating_helpful_votes (
    id          BIGINT PRIMARY KEY,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rating_id   BIGINT NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_rating_helpful_vote UNIQUE (rating_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_rating_helpful_votes_rating
ON rating_helpful_votes(rating_id);

CREATE TABLE IF NOT EXISTS rating_replies (
    id            BIGINT PRIMARY KEY,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NULL,
    rating_id     BIGINT NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
    librarian_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rating_replies_rating_created
ON rating_replies(rating_id, created_at ASC);
