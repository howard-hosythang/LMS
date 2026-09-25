package com.library.catalog.application.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.library.catalog.dto.request.publication.PublicSearchRequest;
import com.library.catalog.dto.response.publication.PublicSearchResult;
import com.library.shared.dto.PageResponse;
import java.sql.ResultSet;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;

@ExtendWith(MockitoExtension.class)
@DisplayName("SearchPublicationsUseCase — SQL contract tests")
class SearchPublicationsUseCaseImplTest {

    @Mock private NamedParameterJdbcTemplate jdbc;

    @InjectMocks private SearchPublicationsUseCaseImpl useCase;

    @Test
    @DisplayName("builds filtered search SQL, normalizes language and caps page size")
    @SuppressWarnings("unchecked")
    void execute_shouldBuildFilteredSqlAndPageResponse() {
        PublicSearchRequest request = new PublicSearchRequest();
        request.setKeyword(" clean code ");
        request.setCategoryIds(List.of(1L, 2L));
        request.setLanguage("en");
        request.setYearFrom(2000);
        request.setYearTo(2020);
        request.setAvailable(true);
        request.setBranch("Central");
        request.setSortBy("rating");
        request.setPage(-3);
        request.setSize(100);

        PublicSearchResult row = new PublicSearchResult(
            42L,
            "Clean Code",
            "cover.jpg",
            2008,
            "desc",
            "Prentice Hall",
            "Robert C. Martin",
            "Software Engineering",
            "Clean Code",
            4,
            1,
            4.5,
            8L,
            20L
        );
        when(jdbc.query(anyString(), any(SqlParameterSource.class), any(RowMapper.class)))
            .thenReturn(List.of(row));
        when(jdbc.queryForObject(anyString(), any(SqlParameterSource.class), eq(Long.class)))
            .thenReturn(1L);

        PageResponse<PublicSearchResult> result = useCase.execute(request, "en-US,en;q=0.9");

        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<SqlParameterSource> paramsCaptor =
            ArgumentCaptor.forClass(SqlParameterSource.class);
        org.mockito.Mockito.verify(jdbc)
            .query(sqlCaptor.capture(), paramsCaptor.capture(), any(RowMapper.class));

        String sql = sqlCaptor.getValue();
        MapSqlParameterSource params = (MapSqlParameterSource) paramsCaptor.getValue();

        assertThat(sql).contains("LOWER(p.title) LIKE :kw");
        assertThat(sql).contains("LEFT JOIN tag_translations tt_all ON tt_all.tag_id = t.id");
        assertThat(sql).contains("AS tag_names");
        assertThat(sql).contains("LOWER(COALESCE(tt_all.name, '')) LIKE :kw");
        assertThat(sql).contains("LEFT JOIN category_translations ct_all ON ct_all.category_id = c.id");
        assertThat(sql).contains("LOWER(COALESCE(ct_all.name, '')) LIKE :kw");
        assertThat(sql).contains("pc.category_id IN (:categoryIds)");
        assertThat(sql).contains("p.language = :language");
        assertThat(sql).contains("i.status = 'AVAILABLE' AND i.branch = :branch");
        assertThat(sql).contains("AVG(r.star::numeric)");
        assertThat(sql).contains("LOWER(COALESCE(tt_all.name, '')) = :kwExactLower");
        assertThat(sql).contains("LIMIT :size OFFSET :offset");
        assertThat(params.getValue("uiLanguage")).isEqualTo("en");
        assertThat(params.getValue("kw")).isEqualTo("%clean code%");
        assertThat(params.getValue("kwExact")).isEqualTo("clean code");
        assertThat(params.getValue("kwExactLower")).isEqualTo("clean code");
        assertThat(params.getValue("categoryIds")).isEqualTo(List.of(1L, 2L));
        assertThat(params.getValue("size")).isEqualTo(50);
        assertThat(params.getValue("offset")).isEqualTo(0);

        assertThat(result.getContent()).containsExactly(row);
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getTotalPages()).isEqualTo(1);
        assertThat(result.isFirst()).isTrue();
        assertThat(result.isLast()).isTrue();
    }

    @Test
    @DisplayName("row mapper maps SQL projection into public search response")
    @SuppressWarnings("unchecked")
    void execute_shouldMapResultSetProjection() throws Exception {
        PublicSearchRequest request = new PublicSearchRequest();
        request.setSize(12);

        when(jdbc.query(anyString(), any(SqlParameterSource.class), any(RowMapper.class)))
            .thenAnswer(invocation -> {
                RowMapper<PublicSearchResult> mapper = invocation.getArgument(2);
                ResultSet rs = org.mockito.Mockito.mock(ResultSet.class);
                when(rs.getLong("publication_id")).thenReturn(99L);
                when(rs.getString("title")).thenReturn("Domain-Driven Design");
                when(rs.getString("cover_image_url")).thenReturn("cover.png");
                when(rs.getObject("publication_year", Integer.class)).thenReturn(2003);
                when(rs.getString("description")).thenReturn("DDD book");
                when(rs.getString("publisher_name")).thenReturn("Addison-Wesley");
                when(rs.getString("author_names")).thenReturn("Eric Evans");
                when(rs.getString("category_names")).thenReturn("Architecture");
                when(rs.getString("tag_names")).thenReturn("Domain Modeling, DDD");
                when(rs.getInt("total_items")).thenReturn(3);
                when(rs.getInt("available_items")).thenReturn(2);
                when(rs.getDouble("avg_rating")).thenReturn(4.8);
                when(rs.getLong("borrow_count")).thenReturn(5L);
                when(rs.getLong("view_count")).thenReturn(11L);
                return List.of(mapper.mapRow(rs, 0));
            });
        when(jdbc.queryForObject(anyString(), any(SqlParameterSource.class), eq(Long.class)))
            .thenReturn(1L);

        PageResponse<PublicSearchResult> result = useCase.execute(request, "vi");

        PublicSearchResult item = result.getContent().getFirst();
        assertThat(item.publicationId()).isEqualTo(99L);
        assertThat(item.title()).isEqualTo("Domain-Driven Design");
        assertThat(item.tagNames()).isEqualTo("Domain Modeling, DDD");
        assertThat(item.availableItems()).isEqualTo(2);
        assertThat(item.avgRating()).isEqualTo(4.8);
        assertThat(item.viewCount()).isEqualTo(11L);
    }
}
