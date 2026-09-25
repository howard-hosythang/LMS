CREATE TABLE IF NOT EXISTS lost_book_recoveries (
    id                         BIGINT NOT NULL,
    created_at                 TIMESTAMPTZ(6) NULL,
    updated_at                 TIMESTAMPTZ(6) NULL,
    transaction_id             BIGINT NOT NULL,
    user_id                    BIGINT NOT NULL,
    item_id                    BIGINT NOT NULL,
    librarian_id               BIGINT NULL,
    previous_item_status       VARCHAR(30) NOT NULL DEFAULT 'LOST',
    new_item_status            VARCHAR(30) NOT NULL,
    recovery_reason            VARCHAR(40) NOT NULL DEFAULT 'OTHER',
    reversed_lost_fine_amount  NUMERIC(15) NOT NULL DEFAULT 0,
    refund_amount              NUMERIC(15) NOT NULL DEFAULT 0,
    note                       TEXT NULL,
    CONSTRAINT lost_book_recoveries_pkey PRIMARY KEY (id),
    CONSTRAINT lost_book_recoveries_new_status_check CHECK (new_item_status IN ('AVAILABLE', 'IN_MAINTENANCE')),
    CONSTRAINT lost_book_recoveries_reason_check CHECK (recovery_reason IN (
        'READER_FOUND', 'LIBRARY_FOUND', 'INVENTORY_FOUND', 'OTHER'
    )),
    CONSTRAINT fk_lost_recovery_transaction FOREIGN KEY (transaction_id) REFERENCES borrowing_transactions(id) ON DELETE CASCADE,
    CONSTRAINT fk_lost_recovery_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_lost_recovery_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    CONSTRAINT fk_lost_recovery_librarian FOREIGN KEY (librarian_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_lost_book_recoveries_transaction
    ON lost_book_recoveries USING btree (transaction_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lost_book_recoveries_item
    ON lost_book_recoveries USING btree (item_id, created_at DESC);
