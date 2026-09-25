ALTER TABLE circulation_policies
    ADD COLUMN IF NOT EXISTS default_deposit_amount NUMERIC(15) NOT NULL DEFAULT 0;

ALTER TABLE borrowing_transactions
    ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(15) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS deposit_status VARCHAR(30) NOT NULL DEFAULT 'NOT_REQUIRED',
    ADD COLUMN IF NOT EXISTS deposit_collected_at TIMESTAMPTZ(6) NULL,
    ADD COLUMN IF NOT EXISTS deposit_collected_by_librarian_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS deposit_settled_at TIMESTAMPTZ(6) NULL,
    ADD COLUMN IF NOT EXISTS deposit_settled_by_librarian_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS deposit_gross_fine_amount NUMERIC(15) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS deposit_applied_amount NUMERIC(15) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS deposit_refund_amount NUMERIC(15) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS deposit_additional_amount_due NUMERIC(15) NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'borrowing_transactions_deposit_status_check'
          AND conrelid = 'borrowing_transactions'::regclass
    ) THEN
        ALTER TABLE borrowing_transactions
            ADD CONSTRAINT borrowing_transactions_deposit_status_check
            CHECK (deposit_status IN (
                'NOT_REQUIRED', 'COLLECTED', 'REFUNDED', 'APPLIED_TO_FINE', 'ADDITIONAL_DUE'
            ));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_borrow_deposit_collected_by_librarian'
          AND conrelid = 'borrowing_transactions'::regclass
    ) THEN
        ALTER TABLE borrowing_transactions
            ADD CONSTRAINT fk_borrow_deposit_collected_by_librarian
            FOREIGN KEY (deposit_collected_by_librarian_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_borrow_deposit_settled_by_librarian'
          AND conrelid = 'borrowing_transactions'::regclass
    ) THEN
        ALTER TABLE borrowing_transactions
            ADD CONSTRAINT fk_borrow_deposit_settled_by_librarian
            FOREIGN KEY (deposit_settled_by_librarian_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS borrow_deposit_events (
    id                    BIGINT NOT NULL,
    created_at            TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    transaction_id         BIGINT NOT NULL,
    user_id                BIGINT NOT NULL,
    item_id                BIGINT NOT NULL,
    librarian_id           BIGINT NULL,
    event_type             VARCHAR(40) NOT NULL,
    amount                 NUMERIC(15) NOT NULL DEFAULT 0,
    gross_fine_amount      NUMERIC(15) NOT NULL DEFAULT 0,
    deposit_balance_before NUMERIC(15) NOT NULL DEFAULT 0,
    deposit_balance_after  NUMERIC(15) NOT NULL DEFAULT 0,
    note                   TEXT NULL,
    CONSTRAINT borrow_deposit_events_pkey PRIMARY KEY (id),
    CONSTRAINT borrow_deposit_events_type_check CHECK (event_type IN (
        'COLLECTED', 'REFUNDED', 'APPLIED_TO_FINE', 'ADDITIONAL_DUE'
    )),
    CONSTRAINT fk_borrow_deposit_events_transaction
        FOREIGN KEY (transaction_id) REFERENCES borrowing_transactions(id) ON DELETE CASCADE,
    CONSTRAINT fk_borrow_deposit_events_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_borrow_deposit_events_item
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    CONSTRAINT fk_borrow_deposit_events_librarian
        FOREIGN KEY (librarian_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_borrow_deposit_events_transaction
    ON borrow_deposit_events USING btree (transaction_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_borrow_deposit_events_user
    ON borrow_deposit_events USING btree (user_id, created_at DESC);
