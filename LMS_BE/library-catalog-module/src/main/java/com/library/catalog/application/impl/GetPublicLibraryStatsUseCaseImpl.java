package com.library.catalog.application.impl;

import com.library.catalog.application.GetPublicLibraryStatsUseCase;
import com.library.catalog.dto.response.publication.PublicLibraryStatsResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetPublicLibraryStatsUseCaseImpl implements GetPublicLibraryStatsUseCase {

  private final NamedParameterJdbcTemplate jdbcTemplate;

  private static final String STATS_SQL = """
      SELECT
          (SELECT COUNT(*) FROM publications) AS total_publications,
          (SELECT COUNT(*) FROM users WHERE status = 'ACTIVE') AS active_users,
          (SELECT COUNT(*) FROM borrowing_transactions
             WHERE status IN ('WAITING_FOR_PICKUP', 'BORROWING', 'RETURNED', 'OVERDUE')) AS total_borrows,
          (SELECT COUNT(*) FROM categories) AS total_categories,
          (SELECT COALESCE(ROUND(AVG(rating::numeric), 1), 0) FROM system_reviews WHERE is_published = TRUE) AS average_rating,
          (SELECT COUNT(*) FROM system_reviews WHERE is_published = TRUE) AS total_ratings,
          (SELECT COUNT(*) FROM system_reviews WHERE is_published = TRUE AND rating >= 3) AS satisfied_ratings
      """;

  @Override
  @Transactional(readOnly = true)
  public PublicLibraryStatsResponse execute() {
    Map<String, Object> row = jdbcTemplate.queryForMap(STATS_SQL, Map.of());
    double averageRating = toDouble(row.get("average_rating"));
    long totalRatings = toLong(row.get("total_ratings"));
    long satisfiedRatings = toLong(row.get("satisfied_ratings"));
    int satisfactionPercent = totalRatings == 0
        ? 0
        : BigDecimal.valueOf(satisfiedRatings)
            .multiply(BigDecimal.valueOf(100))
            .divide(BigDecimal.valueOf(totalRatings), 0, RoundingMode.HALF_UP)
            .setScale(0, RoundingMode.HALF_UP)
            .intValue();

    return PublicLibraryStatsResponse.builder()
        .totalPublications(toLong(row.get("total_publications")))
        .activeUsers(toLong(row.get("active_users")))
        .totalBorrows(toLong(row.get("total_borrows")))
        .totalCategories(toLong(row.get("total_categories")))
        .averageRating(averageRating)
        .totalRatings(totalRatings)
        .satisfactionPercent(satisfactionPercent)
        .build();
  }

  private long toLong(Object value) {
    if (value == null) return 0L;
    return ((Number) value).longValue();
  }

  private double toDouble(Object value) {
    if (value == null) return 0D;
    return ((Number) value).doubleValue();
  }
}
