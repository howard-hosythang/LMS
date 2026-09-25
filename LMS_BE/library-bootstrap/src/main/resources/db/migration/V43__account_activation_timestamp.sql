ALTER TABLE users
    ADD COLUMN IF NOT EXISTS account_activated_at TIMESTAMP WITH TIME ZONE;

UPDATE users
SET account_activated_at = COALESCE(updated_at, created_at, NOW())
WHERE status = 'ACTIVE'
  AND account_activated_at IS NULL;
