-- Indexes for read-heavy public catalogue and report/testimonial endpoints.
-- These complement V20 by covering localized metadata, lower-case LIKE paths,
-- aggregate subqueries and public landing-page widgets.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_publications_title_lower_trgm
    ON publications USING gin (lower(title) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_publications_subtitle_lower_trgm
    ON publications USING gin (lower(subtitle) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_publications_description_lower_trgm
    ON publications USING gin (lower(description) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_publications_year_id
    ON publications(publication_year DESC NULLS LAST, id DESC);

CREATE INDEX IF NOT EXISTS idx_publications_language_year
    ON publications(language, publication_year DESC NULLS LAST, id DESC);

CREATE INDEX IF NOT EXISTS idx_publications_created
    ON publications(created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_publication_translations_language_publication
    ON publication_translations(language_code, publication_id);

CREATE INDEX IF NOT EXISTS idx_publication_translations_title_lower_trgm
    ON publication_translations USING gin (lower(title) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_publication_translations_subtitle_lower_trgm
    ON publication_translations USING gin (lower(subtitle) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_publication_translations_description_lower_trgm
    ON publication_translations USING gin (lower(description) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_publication_translations_ai_summary_lower_trgm
    ON publication_translations USING gin (lower(ai_summary) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tags_name_lower_trgm
    ON tags USING gin (lower(name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tag_translations_tag_language
    ON tag_translations(tag_id, language_code);

CREATE INDEX IF NOT EXISTS idx_tag_translations_name_lower_trgm
    ON tag_translations USING gin (lower(name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_categories_name_lower_trgm
    ON categories USING gin (lower(name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_category_translations_category_language
    ON category_translations(category_id, language_code);

CREATE INDEX IF NOT EXISTS idx_category_translations_name_lower_trgm
    ON category_translations USING gin (lower(name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_authors_name_lower_trgm
    ON authors USING gin (lower(name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_items_publication_status
    ON items(publication_id, status);

CREATE INDEX IF NOT EXISTS idx_ratings_publication_star
    ON ratings(publication_id, star);

CREATE INDEX IF NOT EXISTS idx_borrow_transactions_item_returned
    ON borrowing_transactions(item_id)
    WHERE status = 'RETURNED';

CREATE INDEX IF NOT EXISTS idx_user_interactions_watch_publication
    ON user_interactions(publication_id, created_at DESC)
    WHERE type = 'WATCH';

CREATE INDEX IF NOT EXISTS idx_system_reviews_public_landing
    ON system_reviews(is_published, rating DESC, created_at DESC)
    WHERE is_published = TRUE
      AND comment IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_active_status
    ON users(status)
    WHERE status = 'ACTIVE';
