-- Historical returns must not become new shelving tasks.
ALTER TABLE borrowing_transactions
    ADD COLUMN reshelving_status VARCHAR(20) NOT NULL DEFAULT 'NOT_REQUIRED',
    ADD COLUMN shelved_at TIMESTAMPTZ(6),
    ADD COLUMN shelved_by_librarian_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT borrowing_transactions_reshelving_status_check
        CHECK (reshelving_status IN ('WAITING', 'SHELVED', 'NOT_REQUIRED')),
    ADD CONSTRAINT borrowing_transactions_reshelving_waiting_check
        CHECK (reshelving_status <> 'WAITING' OR (status = 'RETURNED' AND returned_date IS NOT NULL)),
    ADD CONSTRAINT borrowing_transactions_reshelving_time_check
        CHECK ((reshelving_status = 'SHELVED') = (shelved_at IS NOT NULL));

CREATE UNIQUE INDEX idx_reshelving_one_waiting_per_item
    ON borrowing_transactions(item_id) WHERE reshelving_status = 'WAITING';

-- Central guard for ALL paths that borrow, reserve, lose or maintain a copy,
-- including assignments made after the original return. Preserve shelving history.
CREATE FUNCTION clear_waiting_reshelving_on_item_status() RETURNS trigger AS $$
BEGIN
    IF NEW.status <> 'AVAILABLE' AND NEW.status IS DISTINCT FROM OLD.status THEN
        UPDATE borrowing_transactions
        SET reshelving_status = 'NOT_REQUIRED', updated_at = NOW()
        WHERE item_id = NEW.id AND reshelving_status = 'WAITING';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_clear_waiting_reshelving
    AFTER UPDATE OF status ON items
    FOR EACH ROW EXECUTE FUNCTION clear_waiting_reshelving_on_item_status();
