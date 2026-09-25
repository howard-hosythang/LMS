-- V20: Tighten catalogue/AI schema for the final project database.
-- Keep public.tags/publication_tags as the single tag taxonomy consumed by
-- backend, frontend and AI ETL. Older local AI bootstrap scripts created a
-- duplicate ai_engine tag model that is no longer read by the application.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP TABLE IF EXISTS ai_engine.publication_tags;
DROP TABLE IF EXISTS ai_engine.tags;
DROP TABLE IF EXISTS ai_engine.recommendation_cache;

-- Remove invalid or duplicate many-to-many rows before adding natural
-- uniqueness constraints. The id column stays as the technical primary key
-- because existing JPA entities use it.
DELETE FROM publication_authors
WHERE publication_id IS NULL OR author_id IS NULL;

DELETE FROM publication_categories
WHERE publication_id IS NULL OR category_id IS NULL;

DELETE FROM publication_authors pa
USING publication_authors older
WHERE pa.publication_id = older.publication_id
  AND pa.author_id = older.author_id
  AND pa.id > older.id;

DELETE FROM publication_categories pc
USING publication_categories older
WHERE pc.publication_id = older.publication_id
  AND pc.category_id = older.category_id
  AND pc.id > older.id;

DELETE FROM publication_tags pt
USING publication_tags older
WHERE pt.publication_id = older.publication_id
  AND pt.tag_id = older.tag_id
  AND pt.id > older.id;

ALTER TABLE publication_authors
    ALTER COLUMN publication_id SET NOT NULL,
    ALTER COLUMN author_id SET NOT NULL;

ALTER TABLE publication_categories
    ALTER COLUMN publication_id SET NOT NULL,
    ALTER COLUMN category_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_publication_author
    ON publication_authors(publication_id, author_id);

CREATE UNIQUE INDEX IF NOT EXISTS uk_publication_category
    ON publication_categories(publication_id, category_id);

CREATE UNIQUE INDEX IF NOT EXISTS uk_publication_tag
    ON publication_tags(publication_id, tag_id);

CREATE INDEX IF NOT EXISTS idx_publication_authors_author
    ON publication_authors(author_id);

CREATE INDEX IF NOT EXISTS idx_publication_categories_category
    ON publication_categories(category_id);

CREATE INDEX IF NOT EXISTS idx_publication_tags_tag
    ON publication_tags(tag_id);

-- Public search and AI fallback search use ILIKE on text metadata.
CREATE INDEX IF NOT EXISTS idx_publications_title_trgm
    ON publications USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_publications_subtitle_trgm
    ON publications USING gin (subtitle gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_publications_description_trgm
    ON publications USING gin (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_publications_ai_summary_trgm
    ON publications USING gin (ai_summary gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_authors_name_trgm
    ON authors USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_categories_name_trgm
    ON categories USING gin (name gin_trgm_ops);

-- Circulation/reservation hot paths.
CREATE INDEX IF NOT EXISTS idx_items_publication_branch_status
    ON items(publication_id, branch, status);

CREATE INDEX IF NOT EXISTS idx_items_publication_available
    ON items(publication_id)
    WHERE status = 'AVAILABLE';

CREATE INDEX IF NOT EXISTS idx_borrow_user_active_status
    ON borrowing_transactions(user_id, status)
    WHERE status IN ('WAITING_FOR_PICKUP', 'BORROWING');

CREATE INDEX IF NOT EXISTS idx_borrow_item_status
    ON borrowing_transactions(item_id, status);

CREATE INDEX IF NOT EXISTS idx_fines_payment_transaction
    ON fines(payment_status, transaction_id);

CREATE INDEX IF NOT EXISTS idx_reservation_active_queue
    ON reservations(publication_id, preferred_branch, status, reservation_date, id)
    WHERE status IN ('PENDING', 'READY_FOR_PICKUP');

-- Recommendation and dashboard queries.
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_publication
    ON user_interactions(user_id, publication_id);

CREATE INDEX IF NOT EXISTS idx_user_interactions_publication_created
    ON user_interactions(publication_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ratings_publication_created
    ON ratings(publication_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wish_lists_user
    ON wish_lists(user_id);

UPDATE wish_lists_item item
SET wish_list_id = keeper.keep_id
FROM (
    SELECT user_id, MIN(id) AS keep_id
    FROM wish_lists
    WHERE user_id IS NOT NULL
    GROUP BY user_id
) keeper
JOIN wish_lists duplicate_list
  ON duplicate_list.user_id = keeper.user_id
WHERE item.wish_list_id = duplicate_list.id
  AND duplicate_list.id <> keeper.keep_id;

DELETE FROM wish_lists duplicate_list
USING wish_lists keeper
WHERE duplicate_list.user_id = keeper.user_id
  AND duplicate_list.user_id IS NOT NULL
  AND duplicate_list.id > keeper.id;

DELETE FROM wish_lists_item item
USING wish_lists_item older
WHERE item.wish_list_id = older.wish_list_id
  AND item.publication_id = older.publication_id
  AND item.wish_list_id IS NOT NULL
  AND item.publication_id IS NOT NULL
  AND item.id > older.id;

CREATE UNIQUE INDEX IF NOT EXISTS uk_wish_lists_user
    ON wish_lists(user_id)
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_wish_list_item_publication
    ON wish_lists_item(wish_list_id, publication_id)
    WHERE wish_list_id IS NOT NULL AND publication_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wish_lists_item_publication
    ON wish_lists_item(publication_id);

-- AI ETL status lookup.
CREATE INDEX IF NOT EXISTS idx_publication_etl_runs_status_updated
    ON ai_engine.publication_etl_runs(status, updated_at DESC);
