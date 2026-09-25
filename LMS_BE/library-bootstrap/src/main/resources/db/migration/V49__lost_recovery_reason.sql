ALTER TABLE lost_book_recoveries
    ADD COLUMN IF NOT EXISTS recovery_reason VARCHAR(40) NOT NULL DEFAULT 'OTHER';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'lost_book_recoveries_reason_check'
          AND conrelid = 'lost_book_recoveries'::regclass
    ) THEN
        ALTER TABLE lost_book_recoveries
            ADD CONSTRAINT lost_book_recoveries_reason_check CHECK (
                recovery_reason IN ('READER_FOUND', 'LIBRARY_FOUND', 'INVENTORY_FOUND', 'OTHER')
            );
    END IF;
END $$;
