package com.library.recommendation.application.rating.impl;

import com.library.recommendation.application.rating.CreatePublicationRatingUseCase;
import com.library.recommendation.dto.request.CreatePublicationRatingRequest;
import com.library.recommendation.infrastructure.persistence.entity.RatingEntity;
import com.library.recommendation.infrastructure.persistence.repository.RatingJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.service.LibrarianNotificationService;
import com.library.shared.util.TsIdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CreatePublicationRatingUseCaseImpl implements CreatePublicationRatingUseCase {

  private final RatingJpaRepository ratingJpaRepository;
  private final JdbcTemplate jdbcTemplate;
  private final LibrarianNotificationService librarianNotificationService;

  @Override
  @Transactional
  public void execute(Long publicationId, Long userId, CreatePublicationRatingRequest request) {
    EligibleTransaction eligibleTransaction = findEligibleTransaction(publicationId, userId, request.getTransactionId());
    RatingEntity rating = RatingEntity.builder()
        .userId(userId)
        .publicationId(publicationId)
        .transactionId(eligibleTransaction.transactionId())
        .itemBarcode(eligibleTransaction.barcode())
        .comment(request.getComment())
        .star(request.getStar())
        .build();

    rating.setId(TsIdGenerator.next());
    try {
      ratingJpaRepository.save(rating);
      jdbcTemplate.update(
          "UPDATE users SET contribution_score = contribution_score + 5 WHERE id = ?",
          userId
      );
      Map<String, Object> context = jdbcTemplate.queryForMap(
          """
          SELECT u.full_name, u.student_id, p.title
          FROM users u
          JOIN publications p ON p.id = ?
          WHERE u.id = ?
          """,
          publicationId,
          userId
      );
      librarianNotificationService.notifyAll(
          "LIB_REVIEW_NEW",
          "Sinh viên đánh giá sách",
          String.format("%s (%s) đã đánh giá %d sao cho '%s'.",
              context.get("full_name"), context.get("student_id"), request.getStar(), context.get("title")),
          "/librarianpage/public/book/" + publicationId + "?review=" + rating.getId(),
          rating.getId()
      );
    } catch (DataIntegrityViolationException e) {
      throw new AppException(ErrorCode.RATING_ALREADY_EXISTS);
    }
  }

  private EligibleTransaction findEligibleTransaction(Long publicationId, Long userId, Long requestedTransactionId) {
    String transactionFilter = requestedTransactionId != null ? "AND t.id = ? " : "";
    Object[] args = requestedTransactionId != null
        ? new Object[] { userId, publicationId, requestedTransactionId }
        : new Object[] { userId, publicationId };

    List<Map<String, Object>> rows = jdbcTemplate.queryForList(
        """
        SELECT t.id AS transaction_id, t.returned_date, i.barcode,
               CASE WHEN r.id IS NULL THEN FALSE ELSE TRUE END AS reviewed
        FROM borrowing_transactions t
        JOIN items i ON i.id = t.item_id
        LEFT JOIN ratings r ON r.transaction_id = t.id
        WHERE t.user_id = ?
          AND i.publication_id = ?
          AND t.status = 'RETURNED'
          AND t.returned_date IS NOT NULL
        """ + transactionFilter + """
        ORDER BY t.returned_date DESC
        """,
        args
    );

    if (rows.isEmpty()) {
      throw new AppException(ErrorCode.USER_NOT_BORROWED_PUBLICATION);
    }

    Instant now = Instant.now();
    boolean hasFreshReturnedTransaction = false;
    for (Map<String, Object> row : rows) {
      Instant returnedAt = toInstant(row.get("returned_date"));
      boolean reviewed = Boolean.TRUE.equals(row.get("reviewed"));
      if (returnedAt != null && !returnedAt.plus(java.time.Duration.ofDays(7)).isBefore(now)) {
        hasFreshReturnedTransaction = true;
        if (!reviewed) {
          return new EligibleTransaction(
              ((Number) row.get("transaction_id")).longValue(),
              (String) row.get("barcode")
          );
        }
      }
    }

    if (!hasFreshReturnedTransaction) {
      throw new AppException(ErrorCode.RATING_REVIEW_WINDOW_EXPIRED);
    }
    throw new AppException(ErrorCode.RATING_ALREADY_EXISTS);
  }

  private Instant toInstant(Object value) {
    if (value instanceof java.sql.Timestamp ts) return ts.toInstant();
    if (value instanceof java.time.OffsetDateTime odt) return odt.toInstant();
    if (value instanceof Instant instant) return instant;
    return null;
  }

  private record EligibleTransaction(Long transactionId, String barcode) {}
}
