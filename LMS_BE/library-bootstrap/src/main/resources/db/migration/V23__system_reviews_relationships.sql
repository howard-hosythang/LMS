-- V23: Chuẩn hóa các bảng đang rời trong ERD và hỗ trợ system review theo người dùng.

DELETE FROM password_reset_tokens prt
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = prt.user_id
);

DELETE FROM fine_payment_orders fpo
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = fpo.user_id
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_password_reset_tokens_user'
          AND conrelid = 'password_reset_tokens'::regclass
    ) THEN
        ALTER TABLE password_reset_tokens
            ADD CONSTRAINT fk_password_reset_tokens_user
            FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_fine_payment_orders_user'
          AND conrelid = 'fine_payment_orders'::regclass
    ) THEN
        ALTER TABLE fine_payment_orders
            ADD CONSTRAINT fk_fine_payment_orders_user
            FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE RESTRICT;
    END IF;
END $$;

ALTER TABLE system_reviews
    ADD COLUMN IF NOT EXISTS user_id BIGINT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_system_reviews_user'
          AND conrelid = 'system_reviews'::regclass
    ) THEN
        ALTER TABLE system_reviews
            ADD CONSTRAINT fk_system_reviews_user
            FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE;
    END IF;
END $$;

DELETE FROM system_reviews sr
WHERE sr.user_id IS NULL
  AND sr.id IN (1, 2, 3)
  AND sr.reviewer_name IN ('Nguyễn Thị Mai', 'Trần Văn Nam', 'Lê Thị Hương');

CREATE UNIQUE INDEX IF NOT EXISTS uk_system_reviews_user_id
    ON system_reviews(user_id)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_system_reviews_user_id
    ON system_reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_system_reviews_public_quality
    ON system_reviews(is_published, rating DESC, updated_at DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS fine_payment_order_fines (
    order_id BIGINT NOT NULL,
    fine_id  BIGINT NOT NULL,
    CONSTRAINT fine_payment_order_fines_pkey PRIMARY KEY (order_id, fine_id),
    CONSTRAINT fk_fine_payment_order_fines_order
        FOREIGN KEY (order_id) REFERENCES fine_payment_orders(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_fine_payment_order_fines_fine
        FOREIGN KEY (fine_id) REFERENCES fines(id)
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_fine_payment_order_fines_fine_id
    ON fine_payment_order_fines(fine_id);

INSERT INTO fine_payment_order_fines (order_id, fine_id)
SELECT fpo.id, fine_id_text::BIGINT
FROM fine_payment_orders fpo
CROSS JOIN LATERAL regexp_split_to_table(fpo.fine_ids, ',') AS fine_id_text
WHERE fine_id_text ~ '^[0-9]+$'
ON CONFLICT DO NOTHING;
