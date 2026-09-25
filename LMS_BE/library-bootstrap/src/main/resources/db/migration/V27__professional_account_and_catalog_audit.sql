ALTER TABLE users
    ALTER COLUMN student_id TYPE VARCHAR(20);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_is_verified
    ON users USING btree (is_verified);

ALTER TABLE publications
    ADD COLUMN IF NOT EXISTS created_by_librarian_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS updated_by_librarian_id BIGINT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_publications_created_by_librarian'
          AND conrelid = 'publications'::regclass
    ) THEN
        ALTER TABLE publications
            ADD CONSTRAINT fk_publications_created_by_librarian
            FOREIGN KEY (created_by_librarian_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_publications_updated_by_librarian'
          AND conrelid = 'publications'::regclass
    ) THEN
        ALTER TABLE publications
            ADD CONSTRAINT fk_publications_updated_by_librarian
            FOREIGN KEY (updated_by_librarian_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_publications_created_by_librarian
    ON publications USING btree (created_by_librarian_id);

CREATE INDEX IF NOT EXISTS idx_publications_updated_by_librarian
    ON publications USING btree (updated_by_librarian_id);
