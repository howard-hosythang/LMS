CREATE SEQUENCE deposit_payment_order_code_seq START WITH 2000000000000000 MAXVALUE 8999999999999999 NO CYCLE;

CREATE TABLE deposit_payment_orders (
    id BIGINT PRIMARY KEY,
    order_code BIGINT NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    item_id BIGINT NOT NULL REFERENCES items(id),
    flow VARCHAR(20) NOT NULL CHECK (flow IN ('DIRECT', 'TRANSACTION', 'RESERVATION')),
    source_id BIGINT,
    amount NUMERIC(15,0) NOT NULL CHECK (amount > 0 AND amount <= 2147483647),
    description VARCHAR(25) NOT NULL,
    provider VARCHAR(20) NOT NULL DEFAULT 'PAYOS' CHECK (provider = 'PAYOS'),
    status VARCHAR(20) NOT NULL CHECK (status IN ('CREATING', 'PENDING', 'PAID', 'CONSUMED', 'CANCELLED', 'EXPIRED')),
    payment_link_id VARCHAR(100),
    checkout_url TEXT,
    qr_code TEXT,
    created_by_librarian_id BIGINT REFERENCES users(id),
    synced_by_librarian_id BIGINT REFERENCES users(id),
    consumed_transaction_id BIGINT UNIQUE REFERENCES borrowing_transactions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    consumed_at TIMESTAMPTZ,
    CHECK ((flow = 'DIRECT' AND source_id IS NULL) OR (flow <> 'DIRECT' AND source_id IS NOT NULL)),
    CHECK ((status = 'CONSUMED') = (consumed_transaction_id IS NOT NULL))
);

-- One open payment for one borrower/copy, even if another librarian uses a different flow.
CREATE UNIQUE INDEX uq_deposit_payment_open_target ON deposit_payment_orders(user_id, item_id)
    WHERE status IN ('CREATING', 'PENDING', 'PAID');
CREATE INDEX idx_deposit_payment_status ON deposit_payment_orders(status, created_at);
