CREATE TABLE fine_payment_orders (
    id              BIGINT NOT NULL,
    created_at      TIMESTAMPTZ(6) NULL,
    updated_at      TIMESTAMPTZ(6) NULL,
    student_id      VARCHAR(20) NOT NULL,
    user_id         BIGINT NOT NULL,
    order_code      BIGINT NOT NULL,
    amount          NUMERIC(15) NOT NULL,
    fine_count      INT NOT NULL,
    fine_ids        TEXT NOT NULL,
    description     VARCHAR(100) NOT NULL,
    provider        VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL,
    payment_link_id VARCHAR(100) NULL,
    checkout_url    TEXT NULL,
    qr_code         TEXT NULL,
    paid_at         TIMESTAMPTZ(6) NULL,
    reference       VARCHAR(100) NULL,
    CONSTRAINT fine_payment_orders_pkey PRIMARY KEY (id),
    CONSTRAINT fine_payment_orders_order_code_uk UNIQUE (order_code),
    CONSTRAINT fine_payment_orders_provider_check CHECK (provider IN ('PAYOS')),
    CONSTRAINT fine_payment_orders_status_check CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'FAILED'))
);

CREATE INDEX idx_fine_payment_orders_student_status
    ON fine_payment_orders USING btree (student_id, status);

CREATE INDEX idx_fine_payment_orders_payment_link
    ON fine_payment_orders USING btree (payment_link_id);
