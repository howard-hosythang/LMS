-- Enforce unique contact/identity data for managed user accounts.
-- Phone and student_id are nullable, but any non-blank value must be unique.

UPDATE users
SET phone_number = NULL
WHERE phone_number IS NOT NULL
  AND BTRIM(phone_number) = '';

UPDATE users
SET student_id = NULL
WHERE student_id IS NOT NULL
  AND BTRIM(student_id) = '';

UPDATE users
SET phone_number = regexp_replace(BTRIM(phone_number), '\s+', '', 'g')
WHERE phone_number IS NOT NULL;

UPDATE users
SET student_id = BTRIM(student_id)
WHERE student_id IS NOT NULL;

WITH duplicated_phones AS (
    SELECT id,
           row_number() OVER (
               PARTITION BY phone_number
               ORDER BY created_at NULLS LAST, id
           ) AS rn
    FROM users
    WHERE phone_number IS NOT NULL
)
UPDATE users u
SET phone_number = NULL,
    updated_at = NOW()
FROM duplicated_phones d
WHERE u.id = d.id
  AND d.rn > 1;

WITH duplicated_identity_codes AS (
    SELECT id,
           row_number() OVER (
               PARTITION BY student_id
               ORDER BY created_at NULLS LAST, id
           ) AS rn
    FROM users
    WHERE student_id IS NOT NULL
)
UPDATE users u
SET student_id = NULL,
    updated_at = NOW()
FROM duplicated_identity_codes d
WHERE u.id = d.id
  AND d.rn > 1;

DROP INDEX IF EXISTS uq_users_phone_number;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_phone_number
    ON users (phone_number)
    WHERE phone_number IS NOT NULL;

DROP INDEX IF EXISTS uq_users_identity_code;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_identity_code
    ON users (student_id)
    WHERE student_id IS NOT NULL;
