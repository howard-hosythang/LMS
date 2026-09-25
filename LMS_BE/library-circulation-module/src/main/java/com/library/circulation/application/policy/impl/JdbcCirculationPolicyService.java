package com.library.circulation.application.policy.impl;

import com.library.circulation.application.policy.CirculationPolicy;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.dto.request.UpdateCirculationPolicyRequest;
import com.library.shared.constant.RoleConstants;
import com.library.shared.service.LibrarianNotificationService;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class JdbcCirculationPolicyService implements CirculationPolicyService {

    private static final String SELECT_SQL = """
        SELECT cp.pickup_deadline_hours,
               cp.default_loan_days,
               cp.max_active_borrows,
               cp.max_active_reservations,
               cp.overdue_fine_per_day,
               cp.default_deposit_amount,
               cp.block_borrow_when_unpaid_fines,
               cp.updated_by_admin_id,
               u.full_name AS updated_by_admin_name,
               cp.updated_at
        FROM circulation_policies cp
        LEFT JOIN users u ON u.id = cp.updated_by_admin_id
        WHERE cp.id = 1
        """;

    private static final String UPDATE_SQL = """
        UPDATE circulation_policies
        SET pickup_deadline_hours = :pickupDeadlineHours,
            default_loan_days = :defaultLoanDays,
            max_active_borrows = :maxActiveBorrows,
            max_active_reservations = :maxActiveReservations,
            overdue_fine_per_day = :overdueFinePerDay,
            default_deposit_amount = :defaultDepositAmount,
            block_borrow_when_unpaid_fines = :blockBorrowWhenUnpaidFines,
            updated_by_admin_id = :adminId,
            updated_at = NOW()
        WHERE id = 1
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final com.library.shared.service.AuditLogService auditLogService;
    private final LibrarianNotificationService librarianNotificationService;

    @Override
    public CirculationPolicy getPolicy() {
        return jdbcTemplate.queryForObject(SELECT_SQL, Map.of(), (rs, rowNum) -> new CirculationPolicy(
            rs.getInt("pickup_deadline_hours"),
            rs.getInt("default_loan_days"),
            rs.getInt("max_active_borrows"),
            rs.getInt("max_active_reservations"),
            rs.getBigDecimal("overdue_fine_per_day"),
            rs.getBigDecimal("default_deposit_amount"),
            rs.getBoolean("block_borrow_when_unpaid_fines"),
            rs.getObject("updated_by_admin_id") != null ? rs.getLong("updated_by_admin_id") : null,
            rs.getString("updated_by_admin_name"),
            toInstant(rs.getTimestamp("updated_at"))
        ));
    }

    @Override
    @Transactional
    public CirculationPolicy updatePolicy(UpdateCirculationPolicyRequest request, Long adminId) {
        jdbcTemplate.update(
            UPDATE_SQL,
            new MapSqlParameterSource()
                .addValue("pickupDeadlineHours", request.pickupDeadlineHours())
                .addValue("defaultLoanDays", request.defaultLoanDays())
                .addValue("maxActiveBorrows", request.maxActiveBorrows())
                .addValue("maxActiveReservations", request.maxActiveReservations())
                .addValue("overdueFinePerDay", request.overdueFinePerDay())
                .addValue("defaultDepositAmount", request.defaultDepositAmount())
                .addValue("blockBorrowWhenUnpaidFines", request.blockBorrowWhenUnpaidFines())
                .addValue("adminId", adminId)
        );
        auditLogService.log(
            adminId,
            RoleConstants.ADMIN,
            "UPDATE_CIRCULATION_POLICY",
            "circulation_policies",
            1,
            "Admin updated borrowing and return policies",
            Map.of(
                "pickupDeadlineHours", request.pickupDeadlineHours(),
                "defaultLoanDays", request.defaultLoanDays(),
                "maxActiveBorrows", request.maxActiveBorrows(),
                "maxActiveReservations", request.maxActiveReservations(),
                "overdueFinePerDay", request.overdueFinePerDay(),
                "defaultDepositAmount", request.defaultDepositAmount(),
                "blockBorrowWhenUnpaidFines", request.blockBorrowWhenUnpaidFines()
            )
        );
        librarianNotificationService.notifyAll(
            "LIB_POLICY_UPDATED",
            "Admin đã cập nhật quy định mượn trả",
            String.format(
                "Quy định mới: nhận sách trong %d giờ, mượn %d ngày, tối đa %d sách/%d đặt trước, phí trễ hạn %sđ/ngày, cọc mượn %sđ/cuốn, chặn nợ phí: %s.",
                request.pickupDeadlineHours(),
                request.defaultLoanDays(),
                request.maxActiveBorrows(),
                request.maxActiveReservations(),
                request.overdueFinePerDay(),
                request.defaultDepositAmount(),
                Boolean.TRUE.equals(request.blockBorrowWhenUnpaidFines()) ? "bật" : "tắt"
            ),
            "/librarianpage/settings",
            1L
        );
        return getPolicy();
    }

    private Instant toInstant(Timestamp value) {
        return value == null ? null : value.toInstant();
    }
}
