package com.library.catalog.application.impl;

import com.library.catalog.application.GetAllCategoryUseCase;
import com.library.catalog.application.i18n.MetadataLanguage;
import com.library.catalog.dto.response.category.CategoryOverviewResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetAllCategoryUseCaseImpl implements GetAllCategoryUseCase {
    private final NamedParameterJdbcTemplate jdbcTemplate;

    private static final String CATEGORY_OVERVIEW_SQL = """
        SELECT
            c.id,
            COALESCE(NULLIF(ct.name, ''), c.name) AS name,
            COALESCE(NULLIF(ct.bio, ''), c.bio) AS bio,
            c.parent_category_id,
            COALESCE(NULLIF(parent_ct.name, ''), parent.name) AS parent_category_name,
            COUNT(DISTINCT pc.publication_id) AS publication_count
        FROM categories c
        LEFT JOIN categories parent ON parent.id = c.parent_category_id
        LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.language_code = :uiLanguage
        LEFT JOIN category_translations parent_ct ON parent_ct.category_id = parent.id AND parent_ct.language_code = :uiLanguage
        LEFT JOIN publication_categories pc ON pc.category_id = c.id
        GROUP BY c.id, c.name, c.bio, c.parent_category_id, parent.name,
                 ct.name, ct.bio, parent_ct.name
        ORDER BY COUNT(DISTINCT pc.publication_id) DESC, COALESCE(NULLIF(ct.name, ''), c.name) ASC
        """;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryOverviewResponse> execute(String uiLanguage) {
        MapSqlParameterSource params = new MapSqlParameterSource()
            .addValue("uiLanguage", MetadataLanguage.normalize(uiLanguage));
        return jdbcTemplate.query(CATEGORY_OVERVIEW_SQL, params, (rs, rowNum) ->
            CategoryOverviewResponse.builder()
                .id(rs.getLong("id"))
                .name(rs.getString("name"))
                .bio(rs.getString("bio"))
                .parentCategoryId((Long) rs.getObject("parent_category_id"))
                .parentCategoryName(rs.getString("parent_category_name"))
                .publicationCount(rs.getLong("publication_count"))
                .build()
        );
    }
}
