ALTER TABLE contact_messages
    ADD COLUMN IF NOT EXISTS sender_user_id BIGINT REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_contact_messages_sender_user
    ON contact_messages(sender_user_id);

UPDATE contact_messages cm
SET sender_user_id = u.id
FROM users u
WHERE cm.sender_user_id IS NULL
  AND LOWER(cm.sender_email) = LOWER(u.email);
