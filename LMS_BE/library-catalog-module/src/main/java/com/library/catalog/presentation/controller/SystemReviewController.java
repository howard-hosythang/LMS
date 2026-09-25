package com.library.catalog.presentation.controller;

import com.library.catalog.dto.request.SystemReviewRequest;
import com.library.catalog.dto.response.publication.SystemReviewResponse;
import com.library.catalog.dto.response.publication.SystemReviewSummaryResponse;
import com.library.shared.dto.ApiResponseApp;
import com.library.shared.dto.PageResponse;
import com.library.shared.util.RequiresAuthentication;
import com.library.shared.util.TsIdGenerator;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system-reviews")
@RequiredArgsConstructor
public class SystemReviewController {

  private final NamedParameterJdbcTemplate jdbcTemplate;
  private final com.library.shared.util.SecurityEvaluator securityEvaluator;

  private static final String REVIEW_SELECT = """
      SELECT
          sr.id,
          sr.user_id,
          sr.rating,
          sr.comment,
          COALESCE(u.full_name, sr.reviewer_name) AS full_name,
          u.student_id AS student_id,
          u.faculty AS faculty,
          COALESCE(
              NULLIF(sr.reviewer_role, ''),
              u.faculty,
              'Người dùng Library74'
          ) AS reviewer_role,
          COALESCE(u.profile_picture_url, sr.profile_picture_url) AS profile_picture_url,
          sr.is_published,
          sr.created_at,
          sr.updated_at
      FROM system_reviews sr
      LEFT JOIN users u ON u.id = sr.user_id
      """;

  @GetMapping
  public ApiResponseApp<PageResponse<SystemReviewResponse>> getPublicReviews(
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "9") int size,
      @RequestParam(name = "rating", required = false) Integer rating,
      @RequestParam(name = "sort", defaultValue = "newest") String sort
  ) {
    int safePage = Math.max(page, 0);
    int safeSize = Math.max(1, Math.min(size, 30));
    boolean hasRatingFilter = rating != null && rating >= 1 && rating <= 5;
    String whereClause = hasRatingFilter
        ? "WHERE sr.is_published = TRUE AND sr.rating = :rating"
        : "WHERE sr.is_published = TRUE";
    String orderBy = resolvePublicOrderBy(sort);
    MapSqlParameterSource params = new MapSqlParameterSource()
        .addValue("limit", safeSize)
        .addValue("offset", safePage * safeSize);
    if (hasRatingFilter) {
      params.addValue("rating", rating);
    }

    List<SystemReviewResponse> content = jdbcTemplate.query(
        REVIEW_SELECT + whereClause + "\n" + orderBy + """
        LIMIT :limit OFFSET :offset
        """,
        params,
        (rs, rowNum) -> mapReview(rs)
    );
    long total = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM system_reviews sr " + whereClause,
        params,
        Long.class
    );
    int totalPages = total == 0 ? 0 : (int) Math.ceil((double) total / safeSize);
    PageResponse<SystemReviewResponse> response = PageResponse.<SystemReviewResponse>builder()
        .content(content)
        .currentPage(safePage)
        .pageSize(safeSize)
        .totalElements(total)
        .totalPages(totalPages)
        .isFirst(safePage == 0)
        .isLast(totalPages == 0 || safePage >= totalPages - 1)
        .build();
    return ApiResponseApp.success("get system reviews success", response);
  }

  @GetMapping("/top")
  public ApiResponseApp<List<SystemReviewResponse>> getTopReviews(
      @RequestParam(name = "limit", defaultValue = "3") int limit
  ) {
    int safeLimit = Math.max(1, Math.min(limit, 12));
    List<SystemReviewResponse> reviews = jdbcTemplate.query(
        REVIEW_SELECT + """
        WHERE sr.is_published = TRUE
        ORDER BY sr.rating DESC, LENGTH(sr.comment) DESC, COALESCE(sr.updated_at, sr.created_at) DESC
        LIMIT :limit
        """,
        new MapSqlParameterSource("limit", safeLimit),
        (rs, rowNum) -> mapReview(rs)
    );
    return ApiResponseApp.success("get top system reviews success", reviews);
  }

  @GetMapping("/summary")
  public ApiResponseApp<SystemReviewSummaryResponse> getSummary() {
    return ApiResponseApp.success("get system review summary success", querySummary());
  }

  @GetMapping("/me")
  @RequiresAuthentication
  public ApiResponseApp<SystemReviewResponse> getMyReview() {
    Long userId = securityEvaluator.getCurrentUserId();
    List<SystemReviewResponse> reviews = jdbcTemplate.query(
        REVIEW_SELECT + " WHERE sr.user_id = :userId LIMIT 1",
        new MapSqlParameterSource("userId", userId),
        (rs, rowNum) -> mapReview(rs)
    );
    return ApiResponseApp.success("get my system review success", reviews.isEmpty() ? null : reviews.get(0));
  }

  @PutMapping("/me")
  @RequiresAuthentication
  public ApiResponseApp<SystemReviewResponse> upsertMyReview(
      @RequestBody @Valid SystemReviewRequest request
  ) {
    Long userId = securityEvaluator.getCurrentUserId();
    Map<String, Object> user = jdbcTemplate.queryForMap(
        """
        SELECT id, full_name, student_id, faculty, profile_picture_url
        FROM users
        WHERE id = :userId
        """,
        new MapSqlParameterSource("userId", userId)
    );
    String fullName = String.valueOf(user.get("full_name"));
    String faculty = user.get("faculty") == null ? null : String.valueOf(user.get("faculty"));
    String role = faculty == null || faculty.isBlank() ? "Người dùng Library74" : faculty;
    String profilePictureUrl = user.get("profile_picture_url") == null
        ? null
        : String.valueOf(user.get("profile_picture_url"));
    Boolean isNewReview = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) = 0 FROM system_reviews WHERE user_id = :userId",
        new MapSqlParameterSource("userId", userId),
        Boolean.class
    );

    jdbcTemplate.update(
        """
        INSERT INTO system_reviews (
            id, created_at, updated_at, user_id, reviewer_name, reviewer_role,
            profile_picture_url, rating, comment, is_published
        )
        VALUES (
            :id, NOW(), NOW(), :userId, :reviewerName, :reviewerRole,
            :profilePictureUrl, :rating, :comment, TRUE
        )
        ON CONFLICT (user_id) WHERE user_id IS NOT NULL
        DO UPDATE SET
            updated_at = NOW(),
            reviewer_name = EXCLUDED.reviewer_name,
            reviewer_role = EXCLUDED.reviewer_role,
            profile_picture_url = EXCLUDED.profile_picture_url,
            rating = EXCLUDED.rating,
            comment = EXCLUDED.comment,
            is_published = TRUE
        """,
        new MapSqlParameterSource()
            .addValue("id", TsIdGenerator.next())
            .addValue("userId", userId)
            .addValue("reviewerName", fullName)
            .addValue("reviewerRole", role)
            .addValue("profilePictureUrl", profilePictureUrl)
            .addValue("rating", request.getRating())
            .addValue("comment", request.getComment().trim())
    );
    if (Boolean.TRUE.equals(isNewReview)) {
      jdbcTemplate.update(
          "UPDATE users SET contribution_score = COALESCE(contribution_score, 0) + 20 WHERE id = :userId",
          new MapSqlParameterSource("userId", userId)
      );
    }

    return getMyReview();
  }

  private SystemReviewSummaryResponse querySummary() {
    Map<String, Object> row = jdbcTemplate.queryForMap(
        """
        SELECT
            COUNT(*) AS total_reviews,
            COUNT(*) FILTER (WHERE rating >= 3) AS satisfied_reviews,
            COALESCE(ROUND(AVG(rating::numeric), 1), 0) AS average_rating
        FROM system_reviews
        WHERE is_published = TRUE
        """,
        Map.of()
    );
    long totalReviews = toLong(row.get("total_reviews"));
    long satisfiedReviews = toLong(row.get("satisfied_reviews"));
    int satisfactionPercent = totalReviews == 0
        ? 0
        : BigDecimal.valueOf(satisfiedReviews)
            .multiply(BigDecimal.valueOf(100))
            .divide(BigDecimal.valueOf(totalReviews), 0, RoundingMode.HALF_UP)
            .intValue();
    return SystemReviewSummaryResponse.builder()
        .totalReviews(totalReviews)
        .satisfiedReviews(satisfiedReviews)
        .averageRating(toDouble(row.get("average_rating")))
        .satisfactionPercent(satisfactionPercent)
        .build();
  }

  private SystemReviewResponse mapReview(java.sql.ResultSet rs) throws java.sql.SQLException {
    int rating = rs.getInt("rating");
    return SystemReviewResponse.builder()
        .reviewId(rs.getLong("id"))
        .userId(rs.getObject("user_id") == null ? null : rs.getLong("user_id"))
        .rating(rating)
        .comment(rs.getString("comment"))
        .fullName(rs.getString("full_name"))
        .role(rs.getString("reviewer_role"))
        .studentId(rs.getString("student_id"))
        .faculty(rs.getString("faculty"))
        .profilePictureUrl(rs.getString("profile_picture_url"))
        .published(rs.getBoolean("is_published"))
        .satisfied(rating >= 3)
        .createdAt(toInstant(rs.getTimestamp("created_at")))
        .updatedAt(toInstant(rs.getTimestamp("updated_at")))
        .build();
  }

  private String resolvePublicOrderBy(String sort) {
    return switch (sort == null ? "" : sort.toLowerCase()) {
      case "oldest" -> "ORDER BY COALESCE(sr.updated_at, sr.created_at) ASC, sr.id ASC\n";
      case "highest" -> "ORDER BY sr.rating DESC, LENGTH(sr.comment) DESC, COALESCE(sr.updated_at, sr.created_at) DESC\n";
      case "lowest" -> "ORDER BY sr.rating ASC, COALESCE(sr.updated_at, sr.created_at) DESC\n";
      default -> "ORDER BY COALESCE(sr.updated_at, sr.created_at) DESC, sr.rating DESC, LENGTH(sr.comment) DESC\n";
    };
  }

  private Instant toInstant(Timestamp timestamp) {
    return timestamp == null ? null : timestamp.toInstant();
  }

  private long toLong(Object value) {
    return value == null ? 0L : ((Number) value).longValue();
  }

  private double toDouble(Object value) {
    return value == null ? 0D : ((Number) value).doubleValue();
  }
}
