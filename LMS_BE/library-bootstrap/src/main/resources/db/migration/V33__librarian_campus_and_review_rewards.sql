ALTER TABLE users
    ADD COLUMN IF NOT EXISTS librarian_campus VARCHAR(20) NULL;

ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_librarian_campus_check;

ALTER TABLE users
    ADD CONSTRAINT users_librarian_campus_check
        CHECK (librarian_campus IS NULL OR librarian_campus IN ('CAMPUS_1', 'CAMPUS_2', 'ALL'));

UPDATE users
SET librarian_campus = CASE
    WHEN address ILIKE '%Cơ sở 2%' OR address ILIKE '%Dĩ An%' THEN 'CAMPUS_2'
    WHEN student_id LIKE 'LIB%' THEN 'CAMPUS_1'
    ELSE librarian_campus
END
WHERE librarian_campus IS NULL;
