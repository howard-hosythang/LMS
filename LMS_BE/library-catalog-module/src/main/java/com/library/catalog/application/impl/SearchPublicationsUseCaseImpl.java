package com.library.catalog.application.impl;

import com.library.catalog.application.SearchPublicationsUseCase;
import com.library.catalog.application.i18n.MetadataLanguage;
import com.library.catalog.dto.request.publication.PublicSearchRequest;
import com.library.catalog.dto.response.publication.PublicSearchResult;
import com.library.shared.dto.PageResponse;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SearchPublicationsUseCaseImpl implements SearchPublicationsUseCase {

    private final NamedParameterJdbcTemplate jdbc;

    private static final String SELECT_CLAUSE = """
        SELECT
            p.id                                                                          AS publication_id,
            COALESCE(NULLIF(pt.title, ''), p.title)                                      AS title,
            p.cover_image_url,
            p.publication_year,
            COALESCE(NULLIF(pt.description, ''), p.description)                          AS description,
            pub.name                                                                      AS publisher_name,
            (SELECT STRING_AGG(a2.name, ', ' ORDER BY a2.name)
             FROM publication_authors pa2 JOIN authors a2 ON a2.id = pa2.author_id
             WHERE pa2.publication_id = p.id)                                             AS author_names,
            (SELECT STRING_AGG(COALESCE(NULLIF(ct2.name, ''), c2.name), ', ')
             FROM publication_categories pc2
             JOIN categories c2 ON c2.id = pc2.category_id
             LEFT JOIN category_translations ct2 ON ct2.category_id = c2.id AND ct2.language_code = :uiLanguage
             WHERE pc2.publication_id = p.id)                                             AS category_names,
            (SELECT STRING_AGG(COALESCE(NULLIF(tt2.name, ''), t2.name), ', ')
             FROM publication_tags ptag2
             JOIN tags t2 ON t2.id = ptag2.tag_id
             LEFT JOIN tag_translations tt2 ON tt2.tag_id = t2.id AND tt2.language_code = :uiLanguage
             WHERE ptag2.publication_id = p.id)                                            AS tag_names,
            (SELECT COUNT(*) FROM items i2 WHERE i2.publication_id = p.id)                AS total_items,
            (SELECT COUNT(*) FROM items i2 WHERE i2.publication_id = p.id
             AND i2.status = 'AVAILABLE')                                                 AS available_items,
            (SELECT COALESCE(AVG(r.star::numeric), 0) FROM ratings r
             WHERE r.publication_id = p.id)                                               AS avg_rating,
            (SELECT COUNT(*) FROM borrowing_transactions bt
             JOIN items bi ON bi.id = bt.item_id
             WHERE bi.publication_id = p.id)                                              AS borrow_count,
            (SELECT COUNT(*) FROM user_interactions ui
             WHERE ui.publication_id = p.id AND ui.type = 'WATCH')                        AS view_count
        FROM publications p
        LEFT JOIN publishers pub ON pub.id = p.publisher_id
        LEFT JOIN publication_translations pt ON pt.publication_id = p.id AND pt.language_code = :uiLanguage
        """;

    private static final String COUNT_CLAUSE =
        """
        SELECT COUNT(DISTINCT p.id)
        FROM publications p
        LEFT JOIN publishers pub ON pub.id = p.publisher_id
        LEFT JOIN publication_translations pt ON pt.publication_id = p.id AND pt.language_code = :uiLanguage
        """;

    @Override
    public PageResponse<PublicSearchResult> execute(PublicSearchRequest req, String uiLanguage) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("uiLanguage", MetadataLanguage.normalize(uiLanguage));
        String where = buildWhere(req, params);

        int size = Math.min(req.getSize(), 50);
        int page = Math.max(req.getPage(), 0);
        params.addValue("size", size).addValue("offset", page * size);

        String orderBy = buildOrderBy(req.getSortBy(), req.getKeyword());
        String dataSql = SELECT_CLAUSE + where + " ORDER BY " + orderBy + " LIMIT :size OFFSET :offset";
        String countSql = COUNT_CLAUSE + where;

        List<PublicSearchResult> content = jdbc.query(dataSql, params, (rs, row) ->
            new PublicSearchResult(
                rs.getLong("publication_id"),
                rs.getString("title"),
                rs.getString("cover_image_url"),
                rs.getObject("publication_year", Integer.class),
                rs.getString("description"),
                rs.getString("publisher_name"),
                rs.getString("author_names"),
                rs.getString("category_names"),
                rs.getString("tag_names"),
                rs.getInt("total_items"),
                rs.getInt("available_items"),
                rs.getDouble("avg_rating"),
                rs.getLong("borrow_count"),
                rs.getLong("view_count")
            )
        );

        long total = jdbc.queryForObject(countSql, params, Long.class);
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;

        return PageResponse.<PublicSearchResult>builder()
            .content(content)
            .totalElements(total)
            .totalPages(totalPages)
            .currentPage(page)
            .pageSize(size)
            .isFirst(page == 0)
            .isLast(page >= totalPages - 1)
            .build();
    }

    private String buildWhere(PublicSearchRequest req, MapSqlParameterSource params) {
        StringBuilder sb = new StringBuilder("WHERE 1=1 ");

        if (req.getKeyword() != null && !req.getKeyword().isBlank()) {
            String keyword = req.getKeyword().trim();
            String kw = "%" + keyword.toLowerCase(Locale.ROOT) + "%";
            String kwNormalized = "%" + normalizeSearchKeyword(keyword) + "%";
            if (Boolean.TRUE.equals(req.getTitleOnly())) {
                sb.append("""
                AND (LOWER(unaccent(p.title)) LIKE :kwNormalized
                  OR LOWER(unaccent(COALESCE(NULLIF(pt.title, ''), p.title))) LIKE :kwNormalized
                  OR LOWER(unaccent(COALESCE(NULLIF(pt.subtitle, ''), p.subtitle))) LIKE :kwNormalized
                  OR LOWER(p.title) LIKE :kw
                  OR LOWER(COALESCE(NULLIF(pt.title, ''), p.title)) LIKE :kw
                  OR LOWER(COALESCE(NULLIF(pt.subtitle, ''), p.subtitle)) LIKE :kw
                  OR EXISTS (SELECT 1
                             FROM publication_translations pt_all
                             WHERE pt_all.publication_id = p.id
                               AND (LOWER(unaccent(COALESCE(pt_all.title, ''))) LIKE :kwNormalized
                                 OR LOWER(unaccent(COALESCE(pt_all.subtitle, ''))) LIKE :kwNormalized
                                 OR LOWER(COALESCE(pt_all.title, '')) LIKE :kw
                                 OR LOWER(COALESCE(pt_all.subtitle, '')) LIKE :kw)))
                """);
            } else {
                sb.append("""
                AND (LOWER(unaccent(p.title)) LIKE :kwNormalized
                  OR LOWER(unaccent(COALESCE(NULLIF(pt.title, ''), p.title))) LIKE :kwNormalized
                  OR LOWER(unaccent(COALESCE(NULLIF(pt.subtitle, ''), p.subtitle))) LIKE :kwNormalized
                  OR LOWER(unaccent(COALESCE(NULLIF(pt.description, ''), p.description))) LIKE :kwNormalized
                  OR LOWER(p.title) LIKE :kw
                  OR LOWER(COALESCE(NULLIF(pt.title, ''), p.title)) LIKE :kw
                  OR LOWER(COALESCE(NULLIF(pt.subtitle, ''), p.subtitle)) LIKE :kw
                  OR LOWER(COALESCE(NULLIF(pt.description, ''), p.description)) LIKE :kw
                  OR EXISTS (SELECT 1
                             FROM publication_translations pt_all
                             WHERE pt_all.publication_id = p.id
                               AND (LOWER(unaccent(COALESCE(pt_all.title, ''))) LIKE :kwNormalized
                                 OR LOWER(unaccent(COALESCE(pt_all.subtitle, ''))) LIKE :kwNormalized
                                 OR LOWER(unaccent(COALESCE(pt_all.description, ''))) LIKE :kwNormalized
                                 OR LOWER(unaccent(COALESCE(pt_all.ai_summary, ''))) LIKE :kwNormalized
                                 OR LOWER(COALESCE(pt_all.title, '')) LIKE :kw
                                 OR LOWER(COALESCE(pt_all.subtitle, '')) LIKE :kw
                                 OR LOWER(COALESCE(pt_all.description, '')) LIKE :kw
                                 OR LOWER(COALESCE(pt_all.ai_summary, '')) LIKE :kw))
                  OR p.isbn = :kwExact
                  OR EXISTS (SELECT 1 FROM publication_authors pa JOIN authors a ON a.id = pa.author_id
                             WHERE pa.publication_id = p.id
                               AND (LOWER(unaccent(a.name)) LIKE :kwNormalized OR LOWER(a.name) LIKE :kw))
                  OR EXISTS (SELECT 1
                             FROM publication_tags ptag
                             JOIN tags t ON t.id = ptag.tag_id
                             LEFT JOIN tag_translations tt_all ON tt_all.tag_id = t.id
                             WHERE ptag.publication_id = p.id
                               AND (LOWER(unaccent(t.name)) LIKE :kwNormalized
                                 OR LOWER(unaccent(COALESCE(tt_all.name, ''))) LIKE :kwNormalized
                                 OR LOWER(t.name) LIKE :kw
                                 OR LOWER(COALESCE(tt_all.name, '')) LIKE :kw))
                  OR EXISTS (SELECT 1
                             FROM publication_categories pc
                             JOIN categories c ON c.id = pc.category_id
                             LEFT JOIN category_translations ct_all ON ct_all.category_id = c.id
                             WHERE pc.publication_id = p.id
                               AND (LOWER(unaccent(c.name)) LIKE :kwNormalized
                                 OR LOWER(unaccent(COALESCE(ct_all.name, ''))) LIKE :kwNormalized
                                 OR LOWER(c.name) LIKE :kw
                                 OR LOWER(COALESCE(ct_all.name, '')) LIKE :kw)))
                """);
            }
            params.addValue("kw", kw).addValue("kwNormalized", kwNormalized).addValue("kwExact", keyword);
            params.addValue("kwExactLower", keyword.toLowerCase(Locale.ROOT));
            params.addValue("kwExactNormalized", normalizeSearchKeyword(keyword));
        }

        if (req.getCategoryIds() != null && !req.getCategoryIds().isEmpty()) {
            sb.append("AND EXISTS (SELECT 1 FROM publication_categories pc WHERE pc.publication_id = p.id AND pc.category_id IN (:categoryIds)) ");
            params.addValue("categoryIds", req.getCategoryIds());
        } else if (req.getCategoryId() != null) {
            sb.append("AND EXISTS (SELECT 1 FROM publication_categories pc WHERE pc.publication_id = p.id AND pc.category_id = :categoryId) ");
            params.addValue("categoryId", req.getCategoryId());
        }

        if (req.getLanguage() != null && !req.getLanguage().isBlank()) {
            sb.append("AND p.language = :language ");
            params.addValue("language", req.getLanguage());
        }

        if (req.getYearFrom() != null) {
            sb.append("AND p.publication_year >= :yearFrom ");
            params.addValue("yearFrom", req.getYearFrom());
        }

        if (req.getYearTo() != null) {
            sb.append("AND p.publication_year <= :yearTo ");
            params.addValue("yearTo", req.getYearTo());
        }

        boolean hasAvailable = Boolean.TRUE.equals(req.getAvailable());
        boolean hasBranch = req.getBranch() != null && !req.getBranch().isBlank();

        if (hasAvailable && hasBranch) {
            sb.append("AND EXISTS (SELECT 1 FROM items i WHERE i.publication_id = p.id AND i.status = 'AVAILABLE' AND i.branch = :branch) ");
            params.addValue("branch", req.getBranch());
        } else if (hasAvailable) {
            sb.append("AND EXISTS (SELECT 1 FROM items i WHERE i.publication_id = p.id AND i.status = 'AVAILABLE') ");
        } else if (hasBranch) {
            sb.append("AND EXISTS (SELECT 1 FROM items i WHERE i.publication_id = p.id AND i.branch = :branch) ");
            params.addValue("branch", req.getBranch());
        }

        return sb.toString();
    }

    private String buildOrderBy(String sortBy, String keyword) {
        // Khi có keyword, luôn ưu tiên title/subtitle match trước
        String relevancePrefix = "";
        if (keyword != null && !keyword.isBlank()) {
            relevancePrefix = """
                CASE
                    WHEN LOWER(COALESCE(NULLIF(pt.title, ''), p.title)) LIKE :kw THEN 0
                    WHEN LOWER(unaccent(COALESCE(NULLIF(pt.title, ''), p.title))) LIKE :kwNormalized THEN 0
                    WHEN LOWER(COALESCE(NULLIF(pt.subtitle, ''), p.subtitle)) LIKE :kw THEN 1
                    WHEN LOWER(unaccent(COALESCE(NULLIF(pt.subtitle, ''), p.subtitle))) LIKE :kwNormalized THEN 1
                    WHEN EXISTS (
                        SELECT 1
                        FROM publication_translations pt_all
                        WHERE pt_all.publication_id = p.id
                          AND (LOWER(unaccent(COALESCE(pt_all.title, ''))) LIKE :kwNormalized
                            OR LOWER(unaccent(COALESCE(pt_all.subtitle, ''))) LIKE :kwNormalized
                            OR LOWER(COALESCE(pt_all.title, '')) LIKE :kw
                            OR LOWER(COALESCE(pt_all.subtitle, '')) LIKE :kw)
                    ) THEN 1
                    WHEN EXISTS (
                        SELECT 1
                        FROM publication_tags ptag
                        JOIN tags t ON t.id = ptag.tag_id
                        LEFT JOIN tag_translations tt_all ON tt_all.tag_id = t.id
                        WHERE ptag.publication_id = p.id
                          AND (LOWER(unaccent(t.name)) = :kwExactNormalized
                            OR LOWER(unaccent(COALESCE(tt_all.name, ''))) = :kwExactNormalized
                            OR LOWER(t.name) = :kwExactLower
                            OR LOWER(COALESCE(tt_all.name, '')) = :kwExactLower)
                    ) THEN 2
                    WHEN EXISTS (
                        SELECT 1
                        FROM publication_tags ptag
                        JOIN tags t ON t.id = ptag.tag_id
                        LEFT JOIN tag_translations tt_all ON tt_all.tag_id = t.id
                        WHERE ptag.publication_id = p.id
                          AND (LOWER(unaccent(t.name)) LIKE :kwNormalized
                            OR LOWER(unaccent(COALESCE(tt_all.name, ''))) LIKE :kwNormalized
                            OR LOWER(t.name) LIKE :kw
                            OR LOWER(COALESCE(tt_all.name, '')) LIKE :kw)
                    ) THEN 3
                    ELSE 4
                END ASC,\s""";
        }

        String primarySort = switch (sortBy != null ? sortBy : "newest") {
            case "title_az"      -> "COALESCE(NULLIF(pt.title, ''), p.title) ASC";
            case "most_borrowed" -> "(SELECT COUNT(*) FROM borrowing_transactions bt JOIN items bi ON bi.id = bt.item_id WHERE bi.publication_id = p.id) DESC";
            case "most_viewed"   -> "(SELECT COUNT(*) FROM user_interactions ui WHERE ui.publication_id = p.id AND ui.type = 'WATCH') DESC";
            case "rating"        -> "(SELECT COALESCE(AVG(r.star::numeric), 0) FROM ratings r WHERE r.publication_id = p.id) DESC";
            default              -> "p.publication_year DESC NULLS LAST, p.id DESC";
        };

        return relevancePrefix + primarySort;
    }

    private static String normalizeSearchKeyword(String keyword) {
        String normalized = Normalizer.normalize(keyword, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .replace('đ', 'd')
            .replace('Đ', 'D')
            .toLowerCase(Locale.ROOT);
        return normalized.trim();
    }
}
