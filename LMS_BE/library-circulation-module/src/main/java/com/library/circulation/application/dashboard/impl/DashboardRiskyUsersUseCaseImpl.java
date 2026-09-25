package com.library.circulation.application.dashboard.impl;

import com.library.circulation.application.dashboard.DashboardRiskyUsersUseCase;
import com.library.circulation.dto.response.RiskyUserResponse;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardRiskyUsersUseCaseImpl implements DashboardRiskyUsersUseCase {

  private static final Set<String> ALLOWED_SORT_COLUMNS = Set.of(
      "creditScore", "overdueCount", "unpaidFineCount", "totalUnpaidAmount"
  );

  private static final Map<String, String> SORT_COLUMN_MAP = Map.of(
      "creditScore", "u.credit_score",
      "overdueCount", "overdue_count",
      "unpaidFineCount", "unpaid_fine_count",
      "totalUnpaidAmount", "total_unpaid_amount"
  );

  private static final String RISKY_USERS_SQL = """
      SELECT
          u.id                  AS user_id,
          u.student_id          AS student_id,
          u.full_name           AS full_name,
          u.email               AS email,
          u.phone_number        AS phone_number,
          u.profile_picture_url AS profile_picture_url,
          u.credit_score        AS credit_score,
          COUNT(DISTINCT bt.id) FILTER (WHERE bt.status = 'OVERDUE')        AS overdue_count,
          COUNT(DISTINCT f.id)  FILTER (WHERE f.payment_status = 'UNPAID')  AS unpaid_fine_count,
          COALESCE(SUM(f.fine_amount) FILTER (WHERE f.payment_status = 'UNPAID'), 0) AS total_unpaid_amount,
          COUNT(DISTINCT f.id)  FILTER (WHERE f.type = 'DAMAGED_BOOK')      AS damaged_count
      FROM users u
      LEFT JOIN borrowing_transactions bt ON bt.user_id = u.id
      LEFT JOIN fines f ON f.transaction_id = bt.id
      GROUP BY u.id, u.student_id, u.full_name, u.email, u.phone_number, u.profile_picture_url, u.credit_score
      HAVING
          COUNT(DISTINCT f.id)  FILTER (WHERE f.payment_status = 'UNPAID') > 0
          OR COUNT(DISTINCT bt.id) FILTER (WHERE bt.status = 'OVERDUE') > 0
          OR u.credit_score < 100
      """;

  private static final String COUNT_SQL = """
      SELECT COUNT(*) FROM (
          SELECT u.id
          FROM users u
          LEFT JOIN borrowing_transactions bt ON bt.user_id = u.id
          LEFT JOIN fines f ON f.transaction_id = bt.id
          GROUP BY u.id, u.credit_score
          HAVING
              COUNT(DISTINCT f.id)  FILTER (WHERE f.payment_status = 'UNPAID') > 0
              OR COUNT(DISTINCT bt.id) FILTER (WHERE bt.status = 'OVERDUE') > 0
              OR u.credit_score < 100
      ) sub
      """;

  private final NamedParameterJdbcTemplate jdbcTemplate;

  @Override
  @Transactional(readOnly = true)
  public com.library.shared.dto.PageResponse<RiskyUserResponse> execute(int page, int size, String sortBy,
      String sortDir) {
    String safeSort = ALLOWED_SORT_COLUMNS.contains(sortBy) ? sortBy : "creditScore";
    String safeDir = "DESC".equalsIgnoreCase(sortDir) ? "DESC" : "ASC";
    String orderClause = SORT_COLUMN_MAP.get(safeSort) + " " + safeDir;

    String pagedSql = RISKY_USERS_SQL + "ORDER BY " + orderClause + "\nLIMIT :size OFFSET :offset";

    MapSqlParameterSource params = new MapSqlParameterSource()
        .addValue("size", size)
        .addValue("offset", (long) page * size);

    List<RiskyUserResponse> content = jdbcTemplate.query(pagedSql, params, (rs, i) ->
        RiskyUserResponse.builder()
            .userId(rs.getLong("user_id"))
            .studentId(rs.getString("student_id"))
            .fullName(rs.getString("full_name"))
            .email(rs.getString("email"))
            .phoneNumber(rs.getString("phone_number"))
            .profilePictureUrl(rs.getString("profile_picture_url"))
            .creditScore(rs.getInt("credit_score"))
            .riskyMetrics(RiskyUserResponse.RiskyMetrics.builder()
                .overdueCount(rs.getLong("overdue_count"))
                .unpaidFineCount(rs.getLong("unpaid_fine_count"))
                .totalUnpaidAmount(rs.getBigDecimal("total_unpaid_amount"))
                .damagedCount(rs.getLong("damaged_count"))
                .build())
            .build()
    );

    long totalElements = jdbcTemplate.queryForObject(COUNT_SQL, Map.of(), Long.class);
    int totalPages = (int) Math.ceil((double) totalElements / size);

    return com.library.shared.dto.PageResponse.<RiskyUserResponse>builder()
        .content(content)
        .currentPage(page)
        .pageSize(size)
        .totalElements(totalElements)
        .totalPages(totalPages)
        .isFirst(page == 0)
        .isLast(page >= totalPages - 1)
        .build();
  }
}
