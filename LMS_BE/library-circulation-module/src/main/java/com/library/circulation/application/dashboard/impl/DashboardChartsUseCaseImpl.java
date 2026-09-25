package com.library.circulation.application.dashboard.impl;

import com.library.circulation.application.dashboard.DashboardChartsUseCase;
import com.library.circulation.dto.enums.DashboardPeriod;
import com.library.circulation.dto.response.DashboardChartsResponse;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardChartsUseCaseImpl implements DashboardChartsUseCase {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final NamedParameterJdbcTemplate jdbcTemplate;

    private static final String DAILY_TREND_SQL = """
        WITH date_series AS (
            SELECT generate_series(:startDate::date, :endDate::date, '1 day'::interval)::date AS dt
        ),
        borrowed AS (
            SELECT (borrowed_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS dt, COUNT(*) AS cnt
            FROM borrowing_transactions
            WHERE borrowed_date >= :start AND borrowed_date < :end
            GROUP BY 1
        ),
        returned AS (
            SELECT (returned_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS dt, COUNT(*) AS cnt
            FROM borrowing_transactions
            WHERE returned_date >= :start AND returned_date < :end
            GROUP BY 1
        )
        SELECT
            TO_CHAR(ds.dt, 'YYYY-MM-DD') AS date,
            COALESCE(b.cnt, 0)           AS borrowed,
            COALESCE(r.cnt, 0)           AS returned
        FROM date_series ds
        LEFT JOIN borrowed b ON b.dt = ds.dt
        LEFT JOIN returned r ON r.dt = ds.dt
        ORDER BY ds.dt
        """;

    private static final String MONTHLY_TREND_SQL = """
        WITH month_series AS (
            SELECT generate_series(
                DATE_TRUNC('month', :startDate::date),
                DATE_TRUNC('month', :endDate::date),
                '1 month'::interval
            )::date AS dt
        ),
        borrowed AS (
            SELECT DATE_TRUNC('month', borrowed_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS dt, COUNT(*) AS cnt
            FROM borrowing_transactions
            WHERE borrowed_date >= :start AND borrowed_date < :end
            GROUP BY 1
        ),
        returned AS (
            SELECT DATE_TRUNC('month', returned_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS dt, COUNT(*) AS cnt
            FROM borrowing_transactions
            WHERE returned_date >= :start AND returned_date < :end
            GROUP BY 1
        )
        SELECT
            TO_CHAR(ms.dt, 'YYYY-MM') AS date,
            COALESCE(b.cnt, 0)        AS borrowed,
            COALESCE(r.cnt, 0)        AS returned
        FROM month_series ms
        LEFT JOIN borrowed b ON b.dt = ms.dt
        LEFT JOIN returned r ON r.dt = ms.dt
        ORDER BY ms.dt
        """;

    private static final String ITEM_STATUS_SQL = """
        SELECT
            COUNT(CASE WHEN status = 'AVAILABLE'      THEN 1 END) AS available,
            COUNT(CASE WHEN status = 'BORROWED'        THEN 1 END) AS borrowed,
            COUNT(CASE WHEN status = 'RESERVED'        THEN 1 END) AS reserved,
            COUNT(CASE WHEN status = 'IN_MAINTENANCE'  THEN 1 END) AS in_maintenance,
            COUNT(CASE WHEN status = 'LOST'            THEN 1 END) AS lost
        FROM items
        """;

    private static final String TOP_PUBLICATIONS_SQL = """
        SELECT
            p.id              AS publication_id,
            p.title           AS title,
            p.cover_image_url AS cover_image_url,
            COUNT(bt.id)      AS borrow_count
        FROM publications p
        JOIN items i                   ON i.publication_id = p.id
        JOIN borrowing_transactions bt ON bt.item_id = i.id
        WHERE bt.borrowed_date >= :start AND bt.borrowed_date < :end
        GROUP BY p.id, p.title, p.cover_image_url
        ORDER BY borrow_count DESC
        LIMIT 3
        """;

    private static final String FINE_DISTRIBUTION_SQL = """
        SELECT
            COUNT(CASE WHEN type = 'OVERDUE_RETURN' THEN 1 END) AS overdue_return,
            COUNT(CASE WHEN type = 'DAMAGED_BOOK'   THEN 1 END) AS damaged_book,
            COUNT(CASE WHEN type = 'LOST_BOOK'      THEN 1 END) AS lost_book
        FROM fines
        WHERE created_at >= :start AND created_at < :end
        """;

    @Override
    @Transactional(readOnly = true)
    public DashboardChartsResponse execute(DashboardPeriod period) {
        LocalDate today = LocalDate.now(ZONE);
        LocalDate startDate = resolveStartDate(period, today);
        boolean isMonthly = period == DashboardPeriod.SIX_MONTHS || period == DashboardPeriod.YEARLY;

        MapSqlParameterSource params = new MapSqlParameterSource()
            .addValue("startDate", Date.valueOf(startDate))
            .addValue("endDate",   Date.valueOf(today))
            .addValue("start",     Timestamp.from(startDate.atStartOfDay(ZONE).toInstant()))
            .addValue("end",       Timestamp.from(today.plusDays(1).atStartOfDay(ZONE).toInstant()));

        return DashboardChartsResponse.builder()
            .weeklyBorrowReturnTrend(fetchTrend(params, isMonthly))
            .itemStatusDistribution(fetchItemStatusDistribution())
            .topBorrowedPublications(fetchTopPublications(params))
            .fineTypeDistribution(fetchFineDistribution(params))
            .build();
    }

    private LocalDate resolveStartDate(DashboardPeriod period, LocalDate today) {
        return switch (period) {
            case WEEKLY     -> today.minusDays(6);
            case MONTHLY    -> today.minusDays(29);
            case SIX_MONTHS -> today.minusMonths(6).withDayOfMonth(1);
            case YEARLY     -> today.minusMonths(11).withDayOfMonth(1);
        };
    }

    private List<DashboardChartsResponse.TrendPoint> fetchTrend(MapSqlParameterSource params, boolean isMonthly) {
        String sql = isMonthly ? MONTHLY_TREND_SQL : DAILY_TREND_SQL;
        return jdbcTemplate.query(sql, params, (rs, i) ->
            DashboardChartsResponse.TrendPoint.builder()
                .date(rs.getString("date"))
                .borrowed(rs.getLong("borrowed"))
                .returned(rs.getLong("returned"))
                .build()
        );
    }

    private DashboardChartsResponse.ItemStatusDistribution fetchItemStatusDistribution() {
        Map<String, Object> row = jdbcTemplate.queryForMap(ITEM_STATUS_SQL, Map.of());
        return DashboardChartsResponse.ItemStatusDistribution.builder()
            .available(toLong(row.get("available")))
            .borrowed(toLong(row.get("borrowed")))
            .reserved(toLong(row.get("reserved")))
            .inMaintenance(toLong(row.get("in_maintenance")))
            .lost(toLong(row.get("lost")))
            .build();
    }

    private List<DashboardChartsResponse.TopBorrowedPublication> fetchTopPublications(MapSqlParameterSource params) {
        return jdbcTemplate.query(TOP_PUBLICATIONS_SQL, params, (rs, i) ->
            DashboardChartsResponse.TopBorrowedPublication.builder()
                .publicationId(rs.getLong("publication_id"))
                .title(rs.getString("title"))
                .coverImageUrl(rs.getString("cover_image_url"))
                .borrowCount(rs.getLong("borrow_count"))
                .build()
        );
    }

    private DashboardChartsResponse.FineTypeDistribution fetchFineDistribution(MapSqlParameterSource params) {
        Map<String, Object> row = jdbcTemplate.queryForMap(FINE_DISTRIBUTION_SQL, params);
        return DashboardChartsResponse.FineTypeDistribution.builder()
            .overdueReturn(toLong(row.get("overdue_return")))
            .damagedBook(toLong(row.get("damaged_book")))
            .lostBook(toLong(row.get("lost_book")))
            .build();
    }

    private long toLong(Object value) {
        if (value == null) return 0L;
        return ((Number) value).longValue();
    }
}
