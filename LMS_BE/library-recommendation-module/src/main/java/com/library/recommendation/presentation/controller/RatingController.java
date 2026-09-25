package com.library.recommendation.presentation.controller;

import com.library.recommendation.application.rating.CreatePublicationRatingUseCase;
import com.library.recommendation.application.rating.GetPublicationRatingSummaryUseCase;
import com.library.recommendation.application.rating.GetPublicationRatingsUseCase;
import com.library.recommendation.dto.request.CreatePublicationRatingRequest;
import com.library.recommendation.dto.request.ReplyRatingRequest;
import com.library.recommendation.dto.response.PublicationRatingResponse;
import com.library.recommendation.dto.response.PublicationRatingSummaryResponse;
import com.library.recommendation.dto.response.RatingReplyResponse;
import com.library.shared.constant.RoleConstants;
import com.library.shared.dto.ApiResponseApp;
import com.library.shared.dto.PageResponse;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.NotificationMessage;
import com.library.shared.service.AuditLogService;
import com.library.shared.util.RequiresAuthentication;
import com.library.shared.util.RequiresRole;
import com.library.shared.util.SecurityEvaluator;
import com.library.shared.util.TsIdGenerator;
import jakarta.validation.Valid;
import java.util.ArrayList;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class RatingController {


  private final GetPublicationRatingsUseCase getPublicationRatingsUseCase;
  private final CreatePublicationRatingUseCase createPublicationRatingUseCase;
  private final SecurityEvaluator securityEvaluator;
  private final GetPublicationRatingSummaryUseCase getPublicationRatingSummaryUseCase;
  private final JdbcTemplate jdbcTemplate;
  private final NamedParameterJdbcTemplate namedJdbcTemplate;
  private final KafkaTemplate<String, Object> kafkaTemplate;
  private final AuditLogService auditLogService;

  @GetMapping("/publications/{publicationId}/ratings")
  public ApiResponseApp<PageResponse<PublicationRatingResponse>> getPublicationRatings(
      @PathVariable("publicationId") Long publicationId,
      @RequestParam(value = "page", defaultValue = "0") int page,
      @RequestParam(value = "size", defaultValue = "10") int size,
      @RequestParam(value = "star", required = false) Integer star,
      @RequestParam(value = "sort", defaultValue = "newest") String sort) {
    Long currentUserId = securityEvaluator.isAuthenticated() ? securityEvaluator.getCurrentUserId() : null;
    PageResponse<PublicationRatingResponse> response =
        getPublicationRatingsUseCase.execute(publicationId, page, size, star, sort);
    enrichRatings(response.getContent(), currentUserId);
    return ApiResponseApp.success(
        "Get publication ratings successful",
        response);
  }


  @PostMapping("/publications/{publicationId}/ratings")
  @RequiresAuthentication
  public ApiResponseApp<Void> createRating(
      @PathVariable("publicationId") Long publicationId,
      @RequestBody @Valid CreatePublicationRatingRequest request) {
    Long userId = securityEvaluator.getCurrentUserId();

    createPublicationRatingUseCase.execute(publicationId, userId, request);
    return ApiResponseApp.success("Create rating successful");
  }

  @PostMapping("/publications/{publicationId}/ratings/{ratingId}/helpful")
  @RequiresAuthentication
  public ApiResponseApp<Map<String, Object>> toggleHelpful(
      @PathVariable("publicationId") Long publicationId,
      @PathVariable("ratingId") Long ratingId) {
    Long userId = securityEvaluator.getCurrentUserId();
    Integer exists = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM ratings WHERE id = ? AND publication_id = ?",
        Integer.class,
        ratingId,
        publicationId
    );
    if (exists == null || exists == 0) {
      return ApiResponseApp.success(Map.of("helpful", false, "helpfulCount", 0));
    }

    boolean helpful;
    try {
      jdbcTemplate.update(
          "INSERT INTO rating_helpful_votes (id, created_at, rating_id, user_id) VALUES (?, NOW(), ?, ?)",
          TsIdGenerator.next(),
          ratingId,
          userId
      );
      jdbcTemplate.update("UPDATE ratings SET helpful_count = helpful_count + 1 WHERE id = ?", ratingId);
      helpful = true;
      notifyReviewOwner(
          ratingId,
          publicationId,
          userId,
          "REVIEW_HELPFUL",
          "SmartLibrary",
          "Một người đọc đã đánh dấu review của bạn là hữu ích."
      );
    } catch (DuplicateKeyException duplicate) {
      jdbcTemplate.update("DELETE FROM rating_helpful_votes WHERE rating_id = ? AND user_id = ?", ratingId, userId);
      jdbcTemplate.update(
          "UPDATE ratings SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = ?",
          ratingId
      );
      helpful = false;
    }

    Integer helpfulCount = jdbcTemplate.queryForObject(
        "SELECT helpful_count FROM ratings WHERE id = ?",
        Integer.class,
        ratingId
    );
    return ApiResponseApp.success(Map.of("helpful", helpful, "helpfulCount", helpfulCount == null ? 0 : helpfulCount));
  }

  @PutMapping("/publications/{publicationId}/ratings/{ratingId}")
  @RequiresAuthentication
  public ApiResponseApp<Void> updateRating(
      @PathVariable("publicationId") Long publicationId,
      @PathVariable("ratingId") Long ratingId,
      @RequestBody @Valid CreatePublicationRatingRequest request) {
    Long userId = securityEvaluator.getCurrentUserId();
    List<Map<String, Object>> rows = jdbcTemplate.queryForList(
        """
        SELECT id, created_at
        FROM ratings
        WHERE id = ? AND publication_id = ? AND user_id = ?
        """,
        ratingId,
        publicationId,
        userId
    );
    if (rows.isEmpty()) {
      throw new AppException(ErrorCode.RATING_NOT_FOUND);
    }
    Instant createdAt = toInstant(rows.get(0).get("created_at"));
    if (createdAt == null || createdAt.plus(java.time.Duration.ofDays(7)).isBefore(Instant.now())) {
      throw new AppException(ErrorCode.RATING_EDIT_WINDOW_EXPIRED);
    }
    jdbcTemplate.update(
        "UPDATE ratings SET star = ?, comment = ?, updated_at = NOW() WHERE id = ?",
        request.getStar(),
        request.getComment().trim(),
        ratingId
    );
    return ApiResponseApp.success("Update rating successful");
  }

  @PostMapping("/publications/{publicationId}/ratings/{ratingId}/replies")
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<RatingReplyResponse> replyToRating(
      @PathVariable("publicationId") Long publicationId,
      @PathVariable("ratingId") Long ratingId,
      @RequestBody @Valid ReplyRatingRequest request) {
    Long librarianId = securityEvaluator.getCurrentUserId();
    Integer exists = jdbcTemplate.queryForObject(
        "SELECT COUNT(*) FROM ratings WHERE id = ? AND publication_id = ?",
        Integer.class,
        ratingId,
        publicationId
    );
    if (exists == null || exists == 0) {
      throw new IllegalArgumentException("Rating not found");
    }
    Long replyId = TsIdGenerator.next();
    jdbcTemplate.update(
        """
        INSERT INTO rating_replies (id, created_at, updated_at, rating_id, librarian_id, content)
        VALUES (?, NOW(), NOW(), ?, ?, ?)
        """,
        replyId,
        ratingId,
        librarianId,
        request.getContent().trim()
    );
    Map<String, Object> librarian = jdbcTemplate.queryForMap(
        "SELECT full_name, profile_picture_url FROM users WHERE id = ?",
        librarianId
    );
    String librarianName = (String) librarian.get("full_name");
    String librarianAvatarUrl = (String) librarian.get("profile_picture_url");
    notifyReviewOwner(
        ratingId,
        publicationId,
        librarianId,
        "REVIEW_REPLY",
        librarianName,
        librarianName + " đã trả lời review của bạn."
    );
    auditLogService.log(
        librarianId,
        RoleConstants.LIBRARIAN,
        "REPLY_RATING",
        "rating_replies",
        replyId,
        "Librarian replied to a publication rating",
        Map.of("publicationId", publicationId, "ratingId", ratingId)
    );
    return ApiResponseApp.success("Reply created",
        RatingReplyResponse.builder()
            .replyId(replyId)
            .content(request.getContent().trim())
            .librarianName(librarianName)
            .librarianAvatarUrl(librarianAvatarUrl)
            .librarianRoleLabel("Thủ thư")
            .createdAt(java.time.Instant.now())
            .build());
  }

  // public endpoint
  @GetMapping("/publications/{publicationId}/ratings/summary")
  public ApiResponseApp<PublicationRatingSummaryResponse> getPublicationRatingSummary(
      @PathVariable("publicationId") Long publicationId) {
    return ApiResponseApp.success(
        "Get publication rating summary successful",
        getPublicationRatingSummaryUseCase.execute(publicationId));
  }

  private void enrichRatings(List<PublicationRatingResponse> ratings, Long currentUserId) {
    if (ratings == null || ratings.isEmpty()) return;
    List<Long> ratingIds = ratings.stream().map(PublicationRatingResponse::getRatingId).toList();
    Map<Long, List<RatingReplyResponse>> repliesByRatingId = namedJdbcTemplate.query(
        """
        SELECT rr.id, rr.rating_id, rr.content, rr.created_at,
               u.full_name AS librarian_name,
               u.profile_picture_url AS librarian_avatar_url
        FROM rating_replies rr
        JOIN users u ON u.id = rr.librarian_id
        WHERE rr.rating_id IN (:ratingIds)
        ORDER BY rr.created_at ASC
        """,
        new MapSqlParameterSource("ratingIds", ratingIds),
        rs -> {
          Map<Long, List<RatingReplyResponse>> result = new java.util.HashMap<>();
          while (rs.next()) {
            Long ratingId = rs.getLong("rating_id");
            result.computeIfAbsent(ratingId, key -> new ArrayList<>()).add(
                RatingReplyResponse.builder()
                    .replyId(rs.getLong("id"))
                    .content(rs.getString("content"))
                    .librarianName(rs.getString("librarian_name"))
                    .librarianAvatarUrl(rs.getString("librarian_avatar_url"))
                    .librarianRoleLabel("Thủ thư")
                    .createdAt(rs.getTimestamp("created_at").toInstant())
                    .build()
            );
          }
          return result;
        }
    );

    List<Long> likedIds = currentUserId == null ? List.of() : namedJdbcTemplate.queryForList(
        """
        SELECT rating_id
        FROM rating_helpful_votes
        WHERE user_id = :userId AND rating_id IN (:ratingIds)
        """,
        new MapSqlParameterSource()
            .addValue("userId", currentUserId)
            .addValue("ratingIds", ratingIds),
        Long.class
    );
    ratings.forEach(rating -> {
      rating.setReplies(repliesByRatingId.getOrDefault(rating.getRatingId(), List.of()));
      rating.setHelpfulByCurrentUser(likedIds.contains(rating.getRatingId()));
      boolean editable = currentUserId != null
          && currentUserId.equals(rating.getUserId())
          && rating.getEditableUntil() != null
          && !rating.getEditableUntil().isBefore(Instant.now());
      rating.setEditableByCurrentUser(editable);
      rating.setStudentId(null);
    });
  }

  private Instant toInstant(Object value) {
    if (value instanceof java.sql.Timestamp ts) return ts.toInstant();
    if (value instanceof java.time.OffsetDateTime odt) return odt.toInstant();
    if (value instanceof Instant instant) return instant;
    return null;
  }

  private void notifyReviewOwner(
      Long ratingId,
      Long publicationId,
      Long actorUserId,
      String type,
      String title,
      String message) {
    Long ownerUserId = jdbcTemplate.queryForObject(
        "SELECT user_id FROM ratings WHERE id = ? AND publication_id = ?",
        Long.class,
        ratingId,
        publicationId
    );
    if (ownerUserId == null || ownerUserId.equals(actorUserId)) {
      return;
    }
    kafkaTemplate.send(
        KafkaTopics.NOTIFICATION_SEND,
        new NotificationMessage(
            ownerUserId,
            type,
            title,
            message,
            "/userpage/book/" + publicationId,
            ratingId
        )
    );
  }
}
