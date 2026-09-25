ALTER TABLE transaction_notes
    DROP CONSTRAINT IF EXISTS uk_transaction_note_transaction;

CREATE INDEX IF NOT EXISTS idx_transaction_notes_transaction_created
    ON transaction_notes(transaction_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_transaction_notes_librarian
    ON transaction_notes(librarian_id);
