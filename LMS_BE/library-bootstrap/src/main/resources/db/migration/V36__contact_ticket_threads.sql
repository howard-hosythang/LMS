ALTER TABLE contact_messages
    ADD COLUMN IF NOT EXISTS category VARCHAR(40) NOT NULL DEFAULT 'GENERAL',
    ADD COLUMN IF NOT EXISTS assigned_to_user_id BIGINT REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS satisfaction_rating INT CHECK (satisfaction_rating BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS feedback_note TEXT,
    ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_contact_messages_category ON contact_messages(category);
CREATE INDEX IF NOT EXISTS idx_contact_messages_assigned_to ON contact_messages(assigned_to_user_id);

CREATE TABLE IF NOT EXISTS contact_message_comments (
    id BIGSERIAL PRIMARY KEY,
    contact_message_id BIGINT NOT NULL REFERENCES contact_messages(id) ON DELETE CASCADE,
    author_user_id BIGINT REFERENCES users(id),
    author_name VARCHAR(120) NOT NULL,
    author_email VARCHAR(160),
    author_role VARCHAR(30) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_message_comments_ticket
    ON contact_message_comments(contact_message_id, created_at);

INSERT INTO contact_message_comments (
    contact_message_id,
    author_user_id,
    author_name,
    author_email,
    author_role,
    body,
    created_at
)
SELECT
    cm.id,
    NULL,
    cm.sender_name,
    cm.sender_email,
    'USER',
    cm.message,
    cm.created_at
FROM contact_messages cm
WHERE NOT EXISTS (
    SELECT 1
    FROM contact_message_comments c
    WHERE c.contact_message_id = cm.id
);
