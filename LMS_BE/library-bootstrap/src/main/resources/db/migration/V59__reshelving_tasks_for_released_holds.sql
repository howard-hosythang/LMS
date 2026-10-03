-- Holds can expire without a borrowing transaction. Do not manufacture returns.
CREATE TABLE reshelving_tasks (
    id BIGINT PRIMARY KEY,
    item_id BIGINT NOT NULL REFERENCES items(id),
    transaction_id BIGINT REFERENCES borrowing_transactions(id),
    reservation_id BIGINT REFERENCES reservations(id),
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    source VARCHAR(30) NOT NULL CHECK (source IN
        ('RETURN', 'PICKUP_EXPIRED', 'RESERVATION_EXPIRED', 'RESERVATION_CANCELLED', 'LOST_RECOVERED')),
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'SHELVED', 'NOT_REQUIRED')),
    queued_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    shelved_at TIMESTAMPTZ(6),
    shelved_by_librarian_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CHECK ((status = 'SHELVED') = (shelved_at IS NOT NULL)),
    CHECK ((source IN ('RETURN', 'PICKUP_EXPIRED', 'LOST_RECOVERED') AND transaction_id IS NOT NULL AND reservation_id IS NULL)
        OR (source IN ('RESERVATION_EXPIRED', 'RESERVATION_CANCELLED') AND reservation_id IS NOT NULL AND transaction_id IS NULL))
);
CREATE UNIQUE INDEX idx_reshelving_tasks_waiting_item ON reshelving_tasks(item_id) WHERE status = 'WAITING';
CREATE UNIQUE INDEX idx_reshelving_tasks_transaction_source ON reshelving_tasks(transaction_id, source) WHERE transaction_id IS NOT NULL;
CREATE UNIQUE INDEX idx_reshelving_tasks_reservation_source ON reshelving_tasks(reservation_id, source) WHERE reservation_id IS NOT NULL;

INSERT INTO reshelving_tasks(id, item_id, transaction_id, user_id, source, status,
    queued_at, shelved_at, shelved_by_librarian_id)
SELECT id, item_id, id, user_id, 'RETURN', reshelving_status,
    returned_date, shelved_at, shelved_by_librarian_id
FROM borrowing_transactions WHERE reshelving_status IN ('WAITING', 'SHELVED');

CREATE OR REPLACE FUNCTION clear_waiting_reshelving_on_item_status() RETURNS trigger AS $$
BEGIN
    IF NEW.status <> 'AVAILABLE' AND NEW.status IS DISTINCT FROM OLD.status THEN
        UPDATE reshelving_tasks SET status = 'NOT_REQUIRED', updated_at = NOW()
        WHERE item_id = NEW.id AND status = 'WAITING';
        UPDATE borrowing_transactions SET reshelving_status = 'NOT_REQUIRED', updated_at = NOW()
        WHERE item_id = NEW.id AND reshelving_status = 'WAITING';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
