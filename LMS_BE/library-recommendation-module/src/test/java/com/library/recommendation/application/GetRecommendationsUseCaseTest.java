package com.library.recommendation.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.recommendation.application.impl.GetRecommendationsUseCaseImpl;
import com.library.recommendation.dto.response.RecommendationResponse;
import com.library.recommendation.infrastructure.ai.AiGatewayService;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetRecommendationsUseCase — Unit Tests")
class GetRecommendationsUseCaseTest {

  @Mock private NamedParameterJdbcTemplate jdbcTemplate;
  @Mock private AiGatewayService aiGatewayService;

  @Test
  @DisplayName("Ưu tiên kết quả AI gateway và giữ nguyên thứ tự ranking")
  void usesAiGatewayRanking_whenGatewayReturnsIds() {
    GetRecommendationsUseCaseImpl useCase =
        new GetRecommendationsUseCaseImpl(jdbcTemplate, new ObjectMapper(), aiGatewayService);
    when(aiGatewayService.getRecommendations(eq(1001L), isNull(), eq(3)))
        .thenReturn(new AiGatewayService.AiRecommendationResult(List.of(3L, 1L, 2L), "ALS"));
    when(jdbcTemplate.queryForList(anyString(), anyMap()))
        .thenReturn(List.of(row(1L, "Book 1"), row(2L, "Book 2"), row(3L, "Book 3")));

    List<RecommendationResponse> result = useCase.execute(1001L, 3);

    assertThat(result).extracting(RecommendationResponse::getPublicationId)
        .containsExactly(3L, 1L, 2L);
  }

  @Test
  @DisplayName("Dùng cache ai_recommendations khi gateway không trả kết quả")
  void usesCachedRecommendations_whenGatewayEmpty() {
    GetRecommendationsUseCaseImpl useCase =
        new GetRecommendationsUseCaseImpl(jdbcTemplate, new ObjectMapper(), aiGatewayService);
    when(aiGatewayService.getRecommendations(eq(1001L), isNull(), eq(2)))
        .thenReturn(new AiGatewayService.AiRecommendationResult(List.of(), "AI_GATEWAY_UNAVAILABLE"));
    when(jdbcTemplate.queryForList(anyString(), anyMap()))
        .thenReturn(List.of(Map.of("pub_ids", "[2,1]", "strategy", "ALS_CACHE")))
        .thenReturn(List.of(row(1L, "Book 1"), row(2L, "Book 2")));

    List<RecommendationResponse> result = useCase.execute(1001L, 2);

    assertThat(result).extracting(RecommendationResponse::getPublicationId)
        .containsExactly(2L, 1L);
  }

  @Test
  @DisplayName("Fallback sang trending khi gateway và cache đều rỗng")
  void usesTrendingFallback_whenGatewayAndCacheEmpty() {
    GetRecommendationsUseCaseImpl useCase =
        new GetRecommendationsUseCaseImpl(jdbcTemplate, new ObjectMapper(), aiGatewayService);
    when(aiGatewayService.getRecommendations(eq(1001L), isNull(), eq(2)))
        .thenReturn(new AiGatewayService.AiRecommendationResult(List.of(), "TRENDING_FALLBACK"));
    when(jdbcTemplate.queryForList(anyString(), anyMap()))
        .thenReturn(List.of())
        .thenReturn(List.of(row(5L, "Trending 1"), row(6L, "Trending 2")));

    List<RecommendationResponse> result = useCase.execute(1001L, 2);

    assertThat(result).extracting(RecommendationResponse::getPublicationId)
        .containsExactly(5L, 6L);
  }

  private Map<String, Object> row(Long publicationId, String title) {
    return Map.of(
        "publication_id", publicationId,
        "title", title,
        "cover_image_url", "/cover.jpg",
        "publication_year", 2026,
        "available_items", 2,
        "rating_average", BigDecimal.valueOf(4.5),
        "rating_count", 12,
        "author_names", "Author A, Author B"
    );
  }
}
