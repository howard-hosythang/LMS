ALTER TABLE borrowing_transactions
    ADD COLUMN deposit_payment_method VARCHAR(30) NOT NULL DEFAULT 'CASH',
    ADD CONSTRAINT chk_deposit_payment_method CHECK (deposit_payment_method IN ('CASH', 'BANK_TRANSFER'));

ALTER TABLE borrow_deposit_events
    ADD COLUMN payment_method VARCHAR(30) NOT NULL DEFAULT 'CASH',
    ADD CONSTRAINT chk_deposit_event_payment_method CHECK (payment_method IN ('CASH', 'BANK_TRANSFER'));
