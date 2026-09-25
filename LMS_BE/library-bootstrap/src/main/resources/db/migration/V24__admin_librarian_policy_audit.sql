CREATE TABLE IF NOT EXISTS circulation_policies (
    id                               SMALLINT NOT NULL DEFAULT 1,
    created_at                       TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    updated_at                       TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    pickup_deadline_hours            INT NOT NULL DEFAULT 24,
    default_loan_days                INT NOT NULL DEFAULT 14,
    max_active_borrows               INT NOT NULL DEFAULT 5,
    max_active_reservations          INT NOT NULL DEFAULT 2,
    overdue_fine_per_day             NUMERIC(15) NOT NULL DEFAULT 1000,
    block_borrow_when_unpaid_fines   BOOLEAN NOT NULL DEFAULT TRUE,
    updated_by_admin_id              BIGINT NULL,
    CONSTRAINT circulation_policies_pkey PRIMARY KEY (id),
    CONSTRAINT circulation_policies_singleton CHECK (id = 1),
    CONSTRAINT circulation_policies_positive_values CHECK (
        pickup_deadline_hours > 0
        AND default_loan_days > 0
        AND max_active_borrows > 0
        AND max_active_reservations >= 0
        AND overdue_fine_per_day >= 0
    ),
    CONSTRAINT fk_circulation_policies_updated_by_admin
        FOREIGN KEY (updated_by_admin_id) REFERENCES users(id)
);

INSERT INTO circulation_policies (
    id,
    pickup_deadline_hours,
    default_loan_days,
    max_active_borrows,
    max_active_reservations,
    overdue_fine_per_day,
    block_borrow_when_unpaid_fines
)
VALUES (1, 24, 14, 5, 2, 1000, TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS audit_logs (
    id              BIGINT NOT NULL,
    created_at      TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    actor_user_id   BIGINT NULL,
    actor_role      VARCHAR(50) NULL,
    action          VARCHAR(80) NOT NULL,
    entity_type     VARCHAR(80) NOT NULL,
    entity_id       VARCHAR(100) NULL,
    summary         VARCHAR(255) NULL,
    details         JSONB NULL,
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
    CONSTRAINT fk_audit_logs_actor_user FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created
    ON audit_logs USING btree (actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON audit_logs USING btree (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created
    ON audit_logs USING btree (action, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uk_single_admin_account
    ON user_roles (role_id)
    WHERE role_id = 1;

ALTER TABLE fines
    ADD COLUMN IF NOT EXISTS paid_by_librarian_id BIGINT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_fines_paid_by_librarian'
          AND conrelid = 'fines'::regclass
    ) THEN
        ALTER TABLE fines
            ADD CONSTRAINT fk_fines_paid_by_librarian
            FOREIGN KEY (paid_by_librarian_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

ALTER TABLE fine_payment_orders
    ADD COLUMN IF NOT EXISTS created_by_librarian_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS paid_by_librarian_id BIGINT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_fine_payment_orders_created_by_librarian'
          AND conrelid = 'fine_payment_orders'::regclass
    ) THEN
        ALTER TABLE fine_payment_orders
            ADD CONSTRAINT fk_fine_payment_orders_created_by_librarian
            FOREIGN KEY (created_by_librarian_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_fine_payment_orders_paid_by_librarian'
          AND conrelid = 'fine_payment_orders'::regclass
    ) THEN
        ALTER TABLE fine_payment_orders
            ADD CONSTRAINT fk_fine_payment_orders_paid_by_librarian
            FOREIGN KEY (paid_by_librarian_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;
