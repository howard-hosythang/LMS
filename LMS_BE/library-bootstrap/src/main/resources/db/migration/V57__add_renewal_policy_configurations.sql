ALTER TABLE circulation_policies
    ADD COLUMN IF NOT EXISTS max_renewals INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS renewal_window_days INT NOT NULL DEFAULT 2;

UPDATE circulation_policies
SET max_renewals = 1,
    renewal_window_days = 2
WHERE id = 1;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'circulation_policies_renewal_config_check'
          AND conrelid = 'circulation_policies'::regclass
    ) THEN
        ALTER TABLE circulation_policies
            ADD CONSTRAINT circulation_policies_renewal_config_check
            CHECK (max_renewals >= 0 AND renewal_window_days >= 1);
    END IF;
END $$;
