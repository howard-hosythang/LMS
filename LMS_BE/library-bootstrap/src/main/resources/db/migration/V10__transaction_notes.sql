CREATE TABLE transaction_notes (
    id             BIGINT NOT NULL,
    created_at     TIMESTAMPTZ(6) NULL,
    updated_at     TIMESTAMPTZ(6) NULL,
    transaction_id BIGINT NOT NULL,
    librarian_id   BIGINT NOT NULL,
    important      BOOLEAN NOT NULL DEFAULT TRUE,
    note           TEXT NULL,
    CONSTRAINT transaction_notes_pkey PRIMARY KEY (id),
    CONSTRAINT fk_transaction_note_transaction FOREIGN KEY (transaction_id) REFERENCES borrowing_transactions(id),
    CONSTRAINT fk_transaction_note_librarian FOREIGN KEY (librarian_id) REFERENCES users(id),
    CONSTRAINT uk_transaction_note_transaction UNIQUE (transaction_id)
);

CREATE INDEX idx_transaction_notes_transaction_id ON transaction_notes USING btree (transaction_id);
