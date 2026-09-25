ALTER TABLE ratings
ADD COLUMN IF NOT EXISTS transaction_id BIGINT NULL,
ADD COLUMN IF NOT EXISTS item_barcode VARCHAR(50) NULL;

ALTER TABLE ratings
DROP CONSTRAINT IF EXISTS uk_user_publication;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_rating_transaction'
    ) THEN
        ALTER TABLE ratings
        ADD CONSTRAINT fk_rating_transaction
        FOREIGN KEY (transaction_id) REFERENCES borrowing_transactions(id);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uk_rating_transaction
ON ratings(transaction_id)
WHERE transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rating_transaction_id
ON ratings(transaction_id);
