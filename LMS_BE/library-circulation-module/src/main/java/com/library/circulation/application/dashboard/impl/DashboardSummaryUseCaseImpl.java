package com.library.circulation.application.dashboard.impl;

import com.library.circulation.application.dashboard.DashboardSummaryUseCase;
import com.library.circulation.dto.response.DashboardSummaryResponse;
import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardSummaryUseCaseImpl implements DashboardSummaryUseCase {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final NamedParameterJdbcTemplate jdbcTemplate;

    private static final String SUMMARY_SQL = """
        SELECT
            (SELECT COUNT(*)                    FROM users)                                                                          AS total_users,
            (SELECT COUNT(*)                    FROM users              WHERE status = 'ACTIVE')                                     AS active_users,
            (SELECT COUNT(*)                    FROM publications)                                                                   AS total_publications,
            (SELECT COUNT(*)                    FROM items)                                                                          AS total_items,
            (SELECT COUNT(*)                    FROM items              WHERE status = 'AVAILABLE')                                  AS available_items,
            (SELECT COUNT(*)                    FROM borrowing_transactions WHERE borrowed_date  BETWEEN :start AND :end)            AS borrowed_today,
            (SELECT COUNT(*)                    FROM borrowing_transactions WHERE returned_date  BETWEEN :start AND :end)            AS returned_today,
            (SELECT COUNT(*)                    FROM fines              WHERE type = 'DAMAGED_BOOK' AND created_at BETWEEN :start AND :end) AS damaged_today,
            (SELECT COUNT(*)                    FROM fines              WHERE type = 'LOST_BOOK'    AND created_at BETWEEN :start AND :end) AS lost_today,
            (SELECT COUNT(*)                    FROM borrowing_transactions WHERE due_date = :today AND returned_date IS NULL)       AS newly_overdue_today,
            (SELECT COUNT(*)                    FROM borrowing_transactions WHERE status = 'WAITING_FOR_PICKUP')                    AS waiting_for_pickup,
            (SELECT COUNT(*)                    FROM borrowing_transactions WHERE status = 'OVERDUE')                               AS overdue_transactions,
            (SELECT COUNT(*)                    FROM reservations       WHERE status = 'PENDING')                                   AS reservations_pending,
            (SELECT COUNT(*)                    FROM fines              WHERE payment_status = 'UNPAID')                            AS unpaid_fine_count,
            (SELECT COALESCE(SUM(fine_amount), 0) FROM fines            WHERE payment_status = 'UNPAID')                           AS total_unpaid_amount,
            (SELECT COALESCE(SUM(fine_amount), 0) FROM fines            WHERE payment_status = 'PAID' AND paid_date BETWEEN :start AND :end) AS collected_today
        """;

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryResponse execute() {
        LocalDate today = LocalDate.now(ZONE);

        MapSqlParameterSource params = new MapSqlParameterSource()
            .addValue("start", Timestamp.from(today.atStartOfDay(ZONE).toInstant()))
            .addValue("end",   Timestamp.from(today.plusDays(1).atStartOfDay(ZONE).toInstant()))
            .addValue("today", Date.valueOf(today));

        Map<String, Object> row = jdbcTemplate.queryForMap(SUMMARY_SQL, params);
        return mapToResponse(row);
    }

    private DashboardSummaryResponse mapToResponse(Map<String, Object> row) {
        return DashboardSummaryResponse.builder()
            .overview(DashboardSummaryResponse.Overview.builder()
                .totalUsers(toLong(row.get("total_users")))
                .activeUsers(toLong(row.get("active_users")))
                .totalPublications(toLong(row.get("total_publications")))
                .totalItems(toLong(row.get("total_items")))
                .availableItems(toLong(row.get("available_items")))
                .build())
            .todayTransaction(DashboardSummaryResponse.TodayTransaction.builder()
                .borrowedToday(toLong(row.get("borrowed_today")))
                .returnedToday(toLong(row.get("returned_today")))
                .damagedToday(toLong(row.get("damaged_today")))
                .lostToday(toLong(row.get("lost_today")))
                .newlyOverdueToday(toLong(row.get("newly_overdue_today")))
                .build())
            .pendingActions(DashboardSummaryResponse.PendingActions.builder()
                .waitingForPickup(toLong(row.get("waiting_for_pickup")))
                .overdueTransactions(toLong(row.get("overdue_transactions")))
                .reservationsPending(toLong(row.get("reservations_pending")))
                .build())
            .fineSummary(DashboardSummaryResponse.FineSummary.builder()
                .unpaidFineCount(toLong(row.get("unpaid_fine_count")))
                .totalUnpaidAmount(toBigDecimal(row.get("total_unpaid_amount")))
                .collectedToday(toBigDecimal(row.get("collected_today")))
                .build())
            .build();
    }

    private long toLong(Object value) {
        if (value == null) return 0L;
        return ((Number) value).longValue();
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        return new BigDecimal(value.toString());
    }
}
