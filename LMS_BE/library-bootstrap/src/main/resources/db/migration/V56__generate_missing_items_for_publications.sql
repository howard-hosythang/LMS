-- V56: Generate copies (items) for publications that currently have no copies.
-- Each publication receives 2 copies:
--   1. Cơ sở 1 - Lý Thường Kiệt (Barcode: BK-<publication_id>-001)
--   2. Cơ sở 2 - Dĩ An (Barcode: BK-<publication_id>-002)
-- All items use TSID for id, status = 'AVAILABLE', condition = 'NEW',
-- copy_type = 'ORIGINAL', binding_type = 'HARDCOVER', acquired_date = '2026-09-29',
-- acquisition_source = 'Mua mới'.

CREATE SEQUENCE IF NOT EXISTS tsid_item_seed_seq CYCLE MAXVALUE 4095;

CREATE OR REPLACE FUNCTION generate_item_tsid() RETURNS BIGINT AS $$
DECLARE
    our_epoch CONSTANT BIGINT := 1577836800000;
    now_millis BIGINT;
    seq_val BIGINT;
BEGIN
    now_millis := FLOOR(EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
    seq_val := nextval('tsid_item_seed_seq');
    RETURN ((now_millis - our_epoch) << 22) | ((1 & 1023) << 12) | (seq_val & 4095);
END;
$$ LANGUAGE plpgsql;

WITH missing_publications AS (
    SELECT
        p.id AS publication_id,
        ROW_NUMBER() OVER (ORDER BY p.id) AS rn
    FROM publications p
    WHERE NOT EXISTS (
        SELECT 1 FROM items i WHERE i.publication_id = p.id
    )
),
items_to_insert AS (
    -- Copy 1: Cơ sở 1 - Lý Thường Kiệt
    SELECT
        generate_item_tsid() AS id,
        NOW() AS created_at,
        NOW() AS updated_at,
        'BK-' || mp.publication_id || '-001' AS barcode,
        'Cơ sở 1 - Lý Thường Kiệt' AS branch,
        'NEW' AS condition,
        (ARRAY['B4 - 301', 'A2 - 301', 'B4 - 302', 'A2 - 302', 'B4 - 303', 'A2 - 303'])[(mp.rn % 6) + 1] AS location,
        mp.publication_id,
        'AVAILABLE' AS status,
        'ORIGINAL' AS copy_type,
        'HARDCOVER' AS binding_type,
        NULL::text AS condition_note,
        '2026-09-29'::DATE AS acquired_date,
        'Mua mới' AS acquisition_source
    FROM missing_publications mp

    UNION ALL

    -- Copy 2: Cơ sở 2 - Dĩ An
    SELECT
        generate_item_tsid() AS id,
        NOW() AS created_at,
        NOW() AS updated_at,
        'BK-' || mp.publication_id || '-002' AS barcode,
        'Cơ sở 2 - Dĩ An' AS branch,
        'NEW' AS condition,
        (ARRAY['H6 - 201', 'H1 - 603', 'H3 - 603', 'H6 - 202', 'H1 - 604', 'H3 - 604'])[(mp.rn % 6) + 1] AS location,
        mp.publication_id,
        'AVAILABLE' AS status,
        'ORIGINAL' AS copy_type,
        'HARDCOVER' AS binding_type,
        NULL::text AS condition_note,
        '2026-09-29'::DATE AS acquired_date,
        'Mua mới' AS acquisition_source
    FROM missing_publications mp
)
INSERT INTO items (
    id, created_at, updated_at, barcode, branch, condition,
    location, publication_id, status, copy_type, binding_type,
    condition_note, acquired_date, acquisition_source
)
SELECT
    id, created_at, updated_at, barcode, branch, condition,
    location, publication_id, status, copy_type, binding_type,
    condition_note, acquired_date, acquisition_source
FROM items_to_insert;
