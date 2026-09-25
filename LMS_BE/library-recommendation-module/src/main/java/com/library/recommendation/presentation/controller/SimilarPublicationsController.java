package com.library.recommendation.presentation.controller;

import com.library.recommendation.dto.response.RecommendationResponse;
import com.library.recommendation.infrastructure.ai.AiGatewayService;
import com.library.shared.dto.ApiResponseApp;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/publications")
@RequiredArgsConstructor
public class SimilarPublicationsController {

    private final AiGatewayService aiGatewayService;
    private final NamedParameterJdbcTemplate jdbcTemplate;

    private static final String FETCH_PUBS_BY_IDS_SQL = """
        SELECT
            p.id                                                              AS publication_id,
            p.title,
            p.cover_image_url,
            p.publication_year,
            (SELECT COUNT(*) FROM items i
             WHERE i.publication_id = p.id AND i.status = 'AVAILABLE')       AS available_items,
            COALESCE(ROUND(CAST(AVG(r.star) AS numeric), 1), 0.0)            AS rating_average,
            COUNT(DISTINCT r.id)                                             AS rating_count,
            COUNT(DISTINCT bt.id)                                            AS borrow_count,
            STRING_AGG(DISTINCT a.name, ', ')                                AS author_names
        FROM publications p
        LEFT JOIN ratings r ON r.publication_id = p.id
        LEFT JOIN publication_authors pa ON pa.publication_id = p.id
        LEFT JOIN authors a ON a.id = pa.author_id
        LEFT JOIN items bi ON bi.publication_id = p.id
        LEFT JOIN borrowing_transactions bt ON bt.item_id = bi.id
        WHERE p.id IN (:pubIds)
          AND EXISTS (
              SELECT 1 FROM items ai
              WHERE ai.publication_id = p.id AND ai.status = 'AVAILABLE'
          )
        GROUP BY p.id, p.title, p.cover_image_url, p.publication_year
        """;

    @GetMapping("/{publicationId}/similar")
    public ApiResponseApp<List<RecommendationResponse>> getSimilarPublications(
        @PathVariable("publicationId") Long publicationId,
        @RequestParam(name = "limit", defaultValue = "6") int limit
    ) {
        int safeLimit = Math.max(1, Math.min(limit, 20));
        List<Long> rankedIds = aiGatewayService
            .getSimilarPublications(publicationId, safeLimit)
            .publicationIds();

        if (rankedIds == null || rankedIds.isEmpty()) {
            return ApiResponseApp.success(List.of());
        }

        List<RecommendationResponse> fetched = fetchByIds(rankedIds);
        Map<Long, RecommendationResponse> byId = fetched.stream()
            .collect(Collectors.toMap(RecommendationResponse::getPublicationId, r -> r));

        List<RecommendationResponse> ranked = rankedIds.stream()
            .filter(byId::containsKey)
            .map(byId::get)
            .limit(safeLimit)
            .toList();

        return ApiResponseApp.success(ranked);
    }

    private List<RecommendationResponse> fetchByIds(List<Long> pubIds) {
        return jdbcTemplate.queryForList(FETCH_PUBS_BY_IDS_SQL, Map.of("pubIds", pubIds))
            .stream()
            .map(this::toResponse)
            .toList();
    }

    private RecommendationResponse toResponse(Map<String, Object> row) {
        String authorNamesRaw = (String) row.get("author_names");
        List<String> authorNames = authorNamesRaw != null
            ? Arrays.asList(authorNamesRaw.split(", "))
            : Collections.emptyList();

        return RecommendationResponse.builder()
            .publicationId(((Number) row.get("publication_id")).longValue())
            .title((String) row.get("title"))
            .coverImageUrl((String) row.get("cover_image_url"))
            .publicationYear(row.get("publication_year") != null
                ? ((Number) row.get("publication_year")).intValue() : null)
            .availableItems(((Number) row.get("available_items")).intValue())
            .ratingAverage(((Number) row.get("rating_average")).doubleValue())
            .ratingCount(((Number) row.get("rating_count")).intValue())
            .borrowCount(((Number) row.get("borrow_count")).longValue())
            .authorNames(authorNames)
            .build();
    }
}
