package com.library.circulation.application.dashboard.impl;

import com.library.circulation.application.dashboard.ReaderProfileUseCase;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.dto.response.ReaderActivityTimelineResponse;
import com.library.circulation.dto.response.ReaderProfileResponse;
import com.library.user.domain.enums.FacultyEnum;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ReaderProfileUseCaseImpl implements ReaderProfileUseCase {

  private final NamedParameterJdbcTemplate jdbcTemplate;
  private final CirculationPolicyService circulationPolicyService;

  private static final String PROFILE_BASE_SQL = """
      SELECT
        u.id AS user_id,
        u.student_id,
        u.full_name,
        u.email,
        u.phone_number,
        u.profile_picture_url,
        u.faculty,
        COALESCE(u.credit_score, 100) AS credit_score,
        COUNT(DISTINCT bt.id) FILTER (WHERE bt.status IN ('BORROWING', 'OVERDUE')) AS active_borrows,
        COUNT(DISTINCT bt.id) FILTER (WHERE bt.status IN ('BORROWING', 'OVERDUE', 'RETURNED')) AS total_borrowed,
        COUNT(DISTINCT bt.id) FILTER (WHERE bt.status = 'RETURNED') AS returned_count,
        COUNT(DISTINCT bt.id) FILTER (WHERE bt.status = 'OVERDUE') AS overdue_count,
        COUNT(DISTINCT f.id) AS fine_count,
        COUNT(DISTINCT f.id) FILTER (WHERE f.payment_status = 'UNPAID') AS unpaid_fine_count,
        COUNT(DISTINCT f.id) FILTER (WHERE f.type = 'DAMAGED_BOOK') AS damaged_fine_count,
        COUNT(DISTINCT f.id) FILTER (WHERE f.type = 'LOST_BOOK') AS lost_fine_count,
        COALESCE(SUM(f.fine_amount), 0) AS total_fine_amount,
        COALESCE(SUM(f.fine_amount) FILTER (WHERE f.payment_status = 'PAID'), 0) AS paid_fine_amount,
        COALESCE(SUM(f.fine_amount) FILTER (WHERE f.payment_status = 'UNPAID'), 0) AS unpaid_fine_amount
      FROM users u
      LEFT JOIN borrowing_transactions bt ON bt.user_id = u.id
      LEFT JOIN fines f ON f.transaction_id = bt.id
      """;

  private static final String PROFILE_GROUP_SQL = """
      GROUP BY u.id, u.student_id, u.full_name, u.email, u.phone_number, u.profile_picture_url, u.faculty, u.credit_score
      ORDER BY u.id DESC
      LIMIT 1
      """;

  private static final String TRANSACTION_EVENTS_SQL = """
      SELECT
        bt.id,
        COALESCE(p.title, 'Giao dịch mượn sách') AS title,
        COALESCE(i.barcode, '') AS description,
        bt.status,
        COALESCE(bt.borrowed_date, bt.created_at) AS borrowed_at,
        bt.returned_date
      FROM borrowing_transactions bt
      LEFT JOIN items i ON i.id = bt.item_id
      LEFT JOIN publications p ON p.id = i.publication_id
      WHERE bt.user_id = :resolvedUserId
        AND bt.status IN ('BORROWING', 'OVERDUE', 'RETURNED')
        AND (COALESCE(bt.borrowed_date, bt.created_at) IS NOT NULL OR bt.returned_date IS NOT NULL)
      """;

  private static final String FINE_EVENTS_SQL = """
      SELECT
        f.id,
        f.type,
        f.payment_status,
        f.fine_amount,
        COALESCE(f.paid_date, f.created_at) AS occurred_at,
        COALESCE(p.title, '') AS title
      FROM fines f
      JOIN borrowing_transactions bt ON bt.id = f.transaction_id
      LEFT JOIN items i ON i.id = bt.item_id
      LEFT JOIN publications p ON p.id = i.publication_id
      WHERE bt.user_id = :resolvedUserId
        AND (f.payment_status = 'PAID' OR f.type IN ('DAMAGED_BOOK', 'LOST_BOOK'))
        AND COALESCE(f.paid_date, f.created_at) IS NOT NULL
      """;

  @Override
  @Transactional(readOnly = true)
  public ReaderProfileResponse getProfile(Long userId, String studentId) {
    QuerySpec query = profileQuery(userId, studentId);
    int borrowLimit = circulationPolicyService.getPolicy().maxActiveBorrows();
    try {
      return jdbcTemplate.queryForObject(query.sql(), query.params(), (rs, rowNum) -> {
        BigDecimal unpaid = rs.getBigDecimal("unpaid_fine_amount");
        int creditScore = rs.getInt("credit_score");
        String faculty = rs.getString("faculty");
        String facultyDisplayName = facultyDisplayName(faculty);
        return ReaderProfileResponse.builder()
            .userId(rs.getLong("user_id"))
            .studentId(rs.getString("student_id"))
            .fullName(rs.getString("full_name"))
            .email(rs.getString("email"))
            .phoneNumber(rs.getString("phone_number"))
            .profilePictureUrl(rs.getString("profile_picture_url"))
            .faculty(faculty)
            .facultyDisplayName(facultyDisplayName)
            .major(facultyDisplayName)
            .activeBorrows(rs.getInt("active_borrows"))
            .borrowLimit(borrowLimit)
            .unpaidFineAmount(unpaid)
            .creditScore(creditScore)
            .borrowingBlocked(creditScore < 50 || unpaid.compareTo(BigDecimal.ZERO) > 0)
            .totalBorrowed(rs.getLong("total_borrowed"))
            .returnedCount(rs.getLong("returned_count"))
            .overdueCount(rs.getLong("overdue_count"))
            .fineCount(rs.getLong("fine_count"))
            .unpaidFineCount(rs.getLong("unpaid_fine_count"))
            .damagedFineCount(rs.getLong("damaged_fine_count"))
            .lostFineCount(rs.getLong("lost_fine_count"))
            .totalFineAmount(rs.getBigDecimal("total_fine_amount"))
            .paidFineAmount(rs.getBigDecimal("paid_fine_amount"))
            .build();
      });
    } catch (EmptyResultDataAccessException e) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reader not found");
    }
  }

  @Override
  @Transactional(readOnly = true)
  public List<ReaderActivityTimelineResponse> getTimeline(Long userId, String studentId, int limit) {
    ReaderProfileResponse profile = getProfile(userId, studentId);
    int safeLimit = Math.min(Math.max(limit, 1), 20);
    Map<String, Object> params = Map.of("resolvedUserId", profile.getUserId());
    List<ReaderActivityTimelineResponse> events = new ArrayList<>();

    jdbcTemplate.query(TRANSACTION_EVENTS_SQL, params, rs -> {
      Instant borrowedAt = toInstant(rs.getTimestamp("borrowed_at"));
      if (borrowedAt != null) {
        events.add(ReaderActivityTimelineResponse.builder()
            .id(rs.getLong("id"))
            .type("BORROW")
            .title(rs.getString("title"))
            .description(rs.getString("description"))
            .occurredAt(borrowedAt)
            .build());
      }
      Instant returnedAt = toInstant(rs.getTimestamp("returned_date"));
      if (returnedAt != null) {
        events.add(ReaderActivityTimelineResponse.builder()
            .id(rs.getLong("id"))
            .type("RETURN")
            .title(rs.getString("title"))
            .description(rs.getString("description"))
            .occurredAt(returnedAt)
            .build());
      }
    });

    jdbcTemplate.query(FINE_EVENTS_SQL, params, rs -> {
      String fineType = rs.getString("type");
      String eventType = switch (fineType == null ? "" : fineType) {
        case "DAMAGED_BOOK" -> "DAMAGE_REPORT";
        case "LOST_BOOK" -> "LOST_REPORT";
        default -> "FINE_PAID";
      };
      String title = switch (eventType) {
        case "DAMAGE_REPORT" -> "Báo rách/hỏng sách";
        case "LOST_REPORT" -> "Báo mất sách";
        default -> "Nộp phạt";
      };
      events.add(ReaderActivityTimelineResponse.builder()
          .id(rs.getLong("id"))
          .type(eventType)
          .title(title)
          .description(rs.getString("title"))
          .occurredAt(toInstant(rs.getTimestamp("occurred_at")))
          .amount(rs.getBigDecimal("fine_amount"))
          .build());
    });

    return events.stream()
        .filter(event -> event.getOccurredAt() != null)
        .sorted(Comparator.comparing(ReaderActivityTimelineResponse::getOccurredAt).reversed())
        .limit(safeLimit)
        .toList();
  }

  private QuerySpec profileQuery(Long userId, String studentId) {
    String normalizedStudentId = studentId == null || studentId.isBlank() ? null : studentId.trim();
    if (userId == null && normalizedStudentId == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId or studentId is required");
    }
    if (userId != null) {
      return new QuerySpec(
          PROFILE_BASE_SQL + "WHERE u.id = :userId\n" + PROFILE_GROUP_SQL,
          new MapSqlParameterSource().addValue("userId", userId)
      );
    }
    return new QuerySpec(
        PROFILE_BASE_SQL + "WHERE u.student_id = :studentId\n" + PROFILE_GROUP_SQL,
        new MapSqlParameterSource().addValue("studentId", normalizedStudentId)
    );
  }

  private Instant toInstant(Timestamp value) {
    return value == null ? null : value.toInstant();
  }

  private String facultyDisplayName(String faculty) {
    if (faculty == null || faculty.isBlank()) {
      return null;
    }
    try {
      return FacultyEnum.valueOf(faculty).getName();
    } catch (IllegalArgumentException e) {
      String normalized = faculty.replace('_', ' ').toLowerCase();
      return Character.toUpperCase(normalized.charAt(0)) + normalized.substring(1);
    }
  }

  private record QuerySpec(String sql, MapSqlParameterSource params) {
  }
}
