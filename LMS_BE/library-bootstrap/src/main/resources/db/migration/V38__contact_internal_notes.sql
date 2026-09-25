CREATE TABLE IF NOT EXISTS contact_message_internal_notes (
    id BIGSERIAL PRIMARY KEY,
    contact_message_id BIGINT NOT NULL REFERENCES contact_messages(id) ON DELETE CASCADE,
    author_user_id BIGINT NOT NULL REFERENCES users(id),
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_internal_notes_ticket
    ON contact_message_internal_notes(contact_message_id, created_at DESC);

INSERT INTO contact_message_internal_notes (contact_message_id, author_user_id, body, created_at, updated_at)
SELECT cm.id, cm.handled_by_user_id, cm.internal_note, cm.updated_at, cm.updated_at
FROM contact_messages cm
WHERE cm.internal_note IS NOT NULL
  AND TRIM(cm.internal_note) <> ''
  AND cm.handled_by_user_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM contact_message_internal_notes n
      WHERE n.contact_message_id = cm.id
  );
