CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION public.immutable_unaccent(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
    SELECT public.unaccent('public.unaccent'::regdictionary, value)
$$;

CREATE INDEX IF NOT EXISTS idx_publications_isbn
    ON publications(isbn);

CREATE INDEX IF NOT EXISTS idx_publications_format_created
    ON publications(publication_format, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_publications_immutable_title_trgm
    ON publications USING gin (lower(public.immutable_unaccent(coalesce(title, ''))) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_publications_immutable_subtitle_trgm
    ON publications USING gin (lower(public.immutable_unaccent(coalesce(subtitle, ''))) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_publications_immutable_description_trgm
    ON publications USING gin (lower(public.immutable_unaccent(coalesce(description, ''))) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_publication_translations_immutable_title_trgm
    ON publication_translations USING gin (lower(public.immutable_unaccent(coalesce(title, ''))) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_publication_translations_immutable_subtitle_trgm
    ON publication_translations USING gin (lower(public.immutable_unaccent(coalesce(subtitle, ''))) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_publication_translations_immutable_description_trgm
    ON publication_translations USING gin (lower(public.immutable_unaccent(coalesce(description, ''))) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_publication_translations_immutable_ai_summary_trgm
    ON publication_translations USING gin (lower(public.immutable_unaccent(coalesce(ai_summary, ''))) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_authors_immutable_name_trgm
    ON authors USING gin (lower(public.immutable_unaccent(coalesce(name, ''))) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tags_immutable_name_trgm
    ON tags USING gin (lower(public.immutable_unaccent(coalesce(name, ''))) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_categories_immutable_name_trgm
    ON categories USING gin (lower(public.immutable_unaccent(coalesce(name, ''))) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tag_translations_immutable_name_trgm
    ON tag_translations USING gin (lower(public.immutable_unaccent(coalesce(name, ''))) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_category_translations_immutable_name_trgm
    ON category_translations USING gin (lower(public.immutable_unaccent(coalesce(name, ''))) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_publication_categories_category_publication
    ON publication_categories(category_id, publication_id);

CREATE INDEX IF NOT EXISTS idx_publication_tags_tag_publication
    ON publication_tags(tag_id, publication_id);

CREATE INDEX IF NOT EXISTS idx_publication_authors_author_publication
    ON publication_authors(author_id, publication_id);

CREATE INDEX IF NOT EXISTS idx_items_publication_branch_status
    ON items(publication_id, branch, status);

CREATE INDEX IF NOT EXISTS idx_borrow_transactions_item_status
    ON borrowing_transactions(item_id, status);

CREATE INDEX IF NOT EXISTS idx_user_interactions_publication_type_created
    ON user_interactions(publication_id, type, created_at DESC);
