-- V29: Final cleanup for legacy AI duplicate tables.
-- V20 already removed these tables, but existing local databases may have had
-- them recreated later by older AI init scripts. The final architecture keeps
-- tags in public.tags/publication_tags and recommendation output in
-- public.ai_recommendations.

CREATE SCHEMA IF NOT EXISTS ai_engine;

DROP TABLE IF EXISTS ai_engine.publication_tags;
DROP TABLE IF EXISTS ai_engine.tags;
DROP TABLE IF EXISTS ai_engine.recommendation_cache;
