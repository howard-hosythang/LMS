package com.library.recommendation.application.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.recommendation.application.GetRecommendationsUseCase;
import com.library.recommendation.dto.response.RecommendationResponse;
import com.library.recommendation.infrastructure.ai.AiGatewayService;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class GetRecommendationsUseCaseImpl implements GetRecommendationsUseCase {

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final AiGatewayService aiGatewayService;

    private static final String FETCH_AI_RECS_SQL = """
        SELECT pub_ids::text, strategy
        FROM ai_recommendations
        WHERE user_id = :userId
        """;

    private static final String FETCH_PUBS_BY_IDS_SQL = """
        SELECT
            p.id                                                              AS publication_id,
            p.title,
            p.cover_image_url,
            p.publication_year,
            (SELECT COUNT(*) FROM items i
             WHERE i.publication_id = p.id AND i.status = 'AVAILABLE')       AS available_items,
            COALESCE(ROUND(CAST(AVG(r.star) AS numeric), 1), 0.0)            AS rating_average,
            COUNT(DISTINCT r.id)                                              AS rating_count,
            COUNT(DISTINCT bt.id)                                             AS borrow_count,
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

    private static final String FALLBACK_SQL = """
        SELECT
            p.id                                                              AS publication_id,
            p.title,
            p.cover_image_url,
            p.publication_year,
            (SELECT COUNT(*) FROM items i
             WHERE i.publication_id = p.id AND i.status = 'AVAILABLE')       AS available_items,
            COALESCE(ROUND(CAST(AVG(r.star) AS numeric), 1), 0.0)            AS rating_average,
            COUNT(DISTINCT r.id)                                              AS rating_count,
            COALESCE(bc.borrow_count, 0)                                      AS borrow_count,
            STRING_AGG(DISTINCT a.name, ', ')                                AS author_names
        FROM publications p
        LEFT JOIN ratings r ON r.publication_id = p.id
        LEFT JOIN publication_authors pa ON pa.publication_id = p.id
        LEFT JOIN authors a ON a.id = pa.author_id
        LEFT JOIN (
            SELECT i.publication_id, COUNT(*) AS borrow_count
            FROM borrowing_transactions bt
            JOIN items i ON i.id = bt.item_id
            GROUP BY i.publication_id
        ) bc ON bc.publication_id = p.id
        WHERE EXISTS (
            SELECT 1 FROM items ai
            WHERE ai.publication_id = p.id AND ai.status = 'AVAILABLE'
        )
        GROUP BY p.id, p.title, p.cover_image_url, p.publication_year, bc.borrow_count
        ORDER BY COALESCE(bc.borrow_count, 0) DESC
        LIMIT :limit
        """;

    @Override
    public List<RecommendationResponse> execute(Long userId, int limit) {
        return execute(userId, null, limit);
    }

    @Override
    public List<RecommendationResponse> execute(Long userId, String faculty, int limit) {
        List<Long> aiPubIds = fetchFromAiGateway(userId, faculty, limit);
        if (!aiPubIds.isEmpty()) {
            List<RecommendationResponse> fetched = fetchByIds(aiPubIds);
            if (!fetched.isEmpty()) {
                return preserveAiRanking(aiPubIds, fetched, limit);
            }
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            FETCH_AI_RECS_SQL, Map.of("userId", userId));

        if (rows.isEmpty()) {
            log.debug("No AI recommendations for userId={}, using trending fallback", userId);
            return fetchFallback(limit);
        }

        String pubIdsJson = rows.get(0).get("pub_ids").toString();
        List<Long> pubIds = parsePubIds(pubIdsJson, limit);

        if (pubIds.isEmpty()) {
            return fetchFallback(limit);
        }

        List<RecommendationResponse> fetched = fetchByIds(pubIds);
        if (fetched.isEmpty()) {
            return fetchFallback(limit);
        }

        return preserveAiRanking(pubIds, fetched, limit);
    }

    private List<Long> fetchFromAiGateway(Long userId, String faculty, int limit) {
        try {
            AiGatewayService.AiRecommendationResult result =
                aiGatewayService.getRecommendations(userId, faculty, limit);
            if (result == null || result.publicationIds() == null) {
                return Collections.emptyList();
            }
            return result.publicationIds().stream().limit(limit).toList();
        } catch (Exception e) {
            log.warn("AI recommendation gateway failed for userId={}, faculty={}, falling back to cache/local", userId, faculty, e);
            return Collections.emptyList();
        }
    }

    private List<RecommendationResponse> preserveAiRanking(
        List<Long> pubIds,
        List<RecommendationResponse> fetched,
        int limit
    ) {
        Map<Long, RecommendationResponse> byId = fetched.stream()
            .collect(Collectors.toMap(RecommendationResponse::getPublicationId, r -> r));

        return pubIds.stream()
            .filter(byId::containsKey)
            .map(byId::get)
            .limit(limit)
            .toList();
    }

    private List<Long> parsePubIds(String json, int limit) {
        try {
            List<Long> ids = objectMapper.readValue(json, new TypeReference<>() {});
            return ids.stream().limit(limit).toList();
        } catch (Exception e) {
            log.warn("Failed to parse pub_ids JSON: {}", json, e);
            return Collections.emptyList();
        }
    }

    private List<RecommendationResponse> fetchByIds(List<Long> pubIds) {
        return jdbcTemplate.queryForList(FETCH_PUBS_BY_IDS_SQL, Map.of("pubIds", pubIds))
            .stream()
            .map(this::toResponse)
            .toList();
    }

    private List<RecommendationResponse> fetchFallback(int limit) {
        return jdbcTemplate.queryForList(FALLBACK_SQL, Map.of("limit", limit))
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
            .borrowCount(((Number) row.getOrDefault("borrow_count", 0)).longValue())
            .authorNames(authorNames)
            .build();
    }
}
