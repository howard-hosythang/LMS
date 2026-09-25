package com.library.circulation.application.deposit;

import com.library.shared.constant.RoleConstants;
import com.library.shared.service.AuditLogService;
import com.library.shared.util.TsIdGenerator;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BorrowDepositService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private static final String COLLECT_SQL = """
        UPDATE borrowing_transactions
        SET deposit_amount = :amount,
            deposit_status = :status,
            deposit_collected_at = CASE WHEN :amount > 0 THEN NOW() ELSE NULL END,
            deposit_collected_by_librarian_id = CASE WHEN :amount > 0 THEN :librarianId ELSE NULL END
        WHERE id = :transactionId
        """;

    private static final String INSERT_EVENT_SQL = """
        INSERT INTO borrow_deposit_events (
            id, transaction_id, user_id, item_id, librarian_id, event_type,
            amount, gross_fine_amount, deposit_balance_before, deposit_balance_after, note
        )
        SELECT
            :id, t.id, t.user_id, t.item_id, :librarianId, :eventType,
            :amount, :grossFineAmount, :balanceBefore, :balanceAfter, :note
        FROM borrowing_transactions t
        WHERE t.id = :transactionId
        """;

    private static final String UNPAID_FINES_SQL = """
        SELECT id, fine_amount
        FROM fines
        WHERE transaction_id = :transactionId
          AND payment_status = 'UNPAID'
        ORDER BY created_at ASC, id ASC
        """;

    private static final String PAY_FINE_SQL = """
        UPDATE fines
        SET payment_status = 'PAID',
            paid_date = NOW(),
            paid_by_librarian_id = :librarianId
        WHERE id = :fineId
        """;

    private static final String REDUCE_FINE_SQL = """
        UPDATE fines
        SET fine_amount = :remainingAmount
        WHERE id = :fineId
        """;

    private static final String SETTLE_SQL = """
        UPDATE borrowing_transactions
        SET deposit_status = :status,
            deposit_settled_at = NOW(),
            deposit_settled_by_librarian_id = :librarianId,
            deposit_gross_fine_amount = :grossFineAmount,
            deposit_applied_amount = :appliedAmount,
            deposit_refund_amount = :refundAmount,
            deposit_additional_amount_due = :additionalAmountDue
        WHERE id = :transactionId
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final AuditLogService auditLogService;

    public DepositSnapshot collectForBorrow(Long transactionId, Long librarianId, BigDecimal depositAmount) {
        BigDecimal amount = positive(depositAmount);
        String status = amount.signum() > 0 ? "COLLECTED" : "NOT_REQUIRED";
        jdbcTemplate.update(COLLECT_SQL, new MapSqlParameterSource()
            .addValue("transactionId", transactionId)
            .addValue("librarianId", librarianId)
            .addValue("amount", amount)
            .addValue("status", status));

        if (amount.signum() > 0) {
            insertEvent(transactionId, librarianId, "COLLECTED", amount, ZERO, ZERO, amount,
                "Thu tiền cọc khi giao sách cho bạn đọc");
            auditLogService.log(
                librarianId,
                RoleConstants.LIBRARIAN,
                "COLLECT_BORROW_DEPOSIT",
                "borrowing_transactions",
                transactionId,
                "Librarian collected borrow deposit",
                Map.of("transactionId", transactionId, "depositAmount", amount)
            );
        }
        return DepositSnapshot.builder()
            .depositAmount(amount)
            .depositStatus(status)
            .build();
    }

    public DepositSettlement settleOnReturn(Long transactionId, Long librarianId) {
        DepositSnapshot snapshot = getSnapshot(transactionId);
        BigDecimal deposit = positive(snapshot.depositAmount());
        BigDecimal grossFine = sumUnpaidFines(transactionId);

        if (deposit.signum() <= 0) {
            jdbcTemplate.update(SETTLE_SQL, settlementParams(
                transactionId, librarianId, "NOT_REQUIRED", grossFine, ZERO, ZERO, grossFine));
            return DepositSettlement.of(deposit, "NOT_REQUIRED", grossFine, ZERO, ZERO, grossFine);
        }

        BigDecimal applied = deposit.min(grossFine);
        BigDecimal refund = deposit.subtract(applied).max(ZERO);
        BigDecimal additionalDue = grossFine.subtract(applied).max(ZERO);
        String status = additionalDue.signum() > 0
            ? "ADDITIONAL_DUE"
            : applied.signum() > 0 ? "APPLIED_TO_FINE" : "REFUNDED";

        applyDepositToUnpaidFines(transactionId, librarianId, applied);

        jdbcTemplate.update(SETTLE_SQL, settlementParams(
            transactionId, librarianId, status, grossFine, applied, refund, additionalDue));

        if (applied.signum() > 0) {
            insertEvent(transactionId, librarianId, "APPLIED_TO_FINE", applied, grossFine, deposit, refund,
                "Khấu trừ tiền cọc vào phí phạt khi trả sách");
        }
        if (refund.signum() > 0) {
            insertEvent(transactionId, librarianId, "REFUNDED", refund, grossFine, refund, ZERO,
                "Hoàn tiền cọc còn lại cho bạn đọc");
        }
        if (additionalDue.signum() > 0) {
            insertEvent(transactionId, librarianId, "ADDITIONAL_DUE", additionalDue, grossFine, ZERO, ZERO,
                "Phí phạt vượt quá tiền cọc, bạn đọc cần đóng thêm");
        }

        auditLogService.log(
            librarianId,
            RoleConstants.LIBRARIAN,
            "SETTLE_BORROW_DEPOSIT",
            "borrowing_transactions",
            transactionId,
            "Librarian settled borrow deposit against fines",
            Map.of(
                "transactionId", transactionId,
                "depositAmount", deposit,
                "grossFineAmount", grossFine,
                "appliedAmount", applied,
                "refundAmount", refund,
                "additionalAmountDue", additionalDue,
                "depositStatus", status
            )
        );

        return DepositSettlement.of(deposit, status, grossFine, applied, refund, additionalDue);
    }

    private DepositSnapshot getSnapshot(Long transactionId) {
        return jdbcTemplate.queryForObject(
            "SELECT deposit_amount, deposit_status FROM borrowing_transactions WHERE id = :transactionId",
            Map.of("transactionId", transactionId),
            (rs, rowNum) -> DepositSnapshot.builder()
                .depositAmount(rs.getBigDecimal("deposit_amount"))
                .depositStatus(rs.getString("deposit_status"))
                .build()
        );
    }

    private BigDecimal sumUnpaidFines(Long transactionId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(UNPAID_FINES_SQL, Map.of("transactionId", transactionId));
        return rows.stream()
            .map(row -> (BigDecimal) row.get("fine_amount"))
            .reduce(ZERO, BigDecimal::add);
    }

    private void applyDepositToUnpaidFines(Long transactionId, Long librarianId, BigDecimal appliedAmount) {
        BigDecimal remainingDeposit = positive(appliedAmount);
        if (remainingDeposit.signum() <= 0) return;

        List<Map<String, Object>> fines = jdbcTemplate.queryForList(UNPAID_FINES_SQL, Map.of("transactionId", transactionId));
        for (Map<String, Object> fine : fines) {
            if (remainingDeposit.signum() <= 0) break;

            Long fineId = ((Number) fine.get("id")).longValue();
            BigDecimal fineAmount = positive((BigDecimal) fine.get("fine_amount"));
            if (remainingDeposit.compareTo(fineAmount) >= 0) {
                jdbcTemplate.update(PAY_FINE_SQL, Map.of("fineId", fineId, "librarianId", librarianId));
                remainingDeposit = remainingDeposit.subtract(fineAmount);
            } else {
                BigDecimal remainingFine = fineAmount.subtract(remainingDeposit);
                jdbcTemplate.update(REDUCE_FINE_SQL, Map.of("fineId", fineId, "remainingAmount", remainingFine));
                remainingDeposit = ZERO;
            }
        }
    }

    private MapSqlParameterSource settlementParams(
        Long transactionId,
        Long librarianId,
        String status,
        BigDecimal grossFineAmount,
        BigDecimal appliedAmount,
        BigDecimal refundAmount,
        BigDecimal additionalAmountDue
    ) {
        return new MapSqlParameterSource()
            .addValue("transactionId", transactionId)
            .addValue("librarianId", librarianId)
            .addValue("status", status)
            .addValue("grossFineAmount", positive(grossFineAmount))
            .addValue("appliedAmount", positive(appliedAmount))
            .addValue("refundAmount", positive(refundAmount))
            .addValue("additionalAmountDue", positive(additionalAmountDue));
    }

    private void insertEvent(
        Long transactionId,
        Long librarianId,
        String eventType,
        BigDecimal amount,
        BigDecimal grossFineAmount,
        BigDecimal balanceBefore,
        BigDecimal balanceAfter,
        String note
    ) {
        jdbcTemplate.update(INSERT_EVENT_SQL, new MapSqlParameterSource()
            .addValue("id", TsIdGenerator.next())
            .addValue("transactionId", transactionId)
            .addValue("librarianId", librarianId)
            .addValue("eventType", eventType)
            .addValue("amount", positive(amount))
            .addValue("grossFineAmount", positive(grossFineAmount))
            .addValue("balanceBefore", positive(balanceBefore))
            .addValue("balanceAfter", positive(balanceAfter))
            .addValue("note", note));
    }

    private BigDecimal positive(BigDecimal value) {
        if (value == null || value.signum() < 0) return ZERO;
        return value;
    }

    @Builder
    public record DepositSnapshot(
        BigDecimal depositAmount,
        String depositStatus
    ) {
    }

    @Builder
    public record DepositSettlement(
        BigDecimal depositAmount,
        String depositStatus,
        BigDecimal grossFineAmount,
        BigDecimal depositAppliedAmount,
        BigDecimal depositRefundAmount,
        BigDecimal additionalAmountDue
    ) {
        static DepositSettlement of(
            BigDecimal depositAmount,
            String depositStatus,
            BigDecimal grossFineAmount,
            BigDecimal depositAppliedAmount,
            BigDecimal depositRefundAmount,
            BigDecimal additionalAmountDue
        ) {
            return DepositSettlement.builder()
                .depositAmount(depositAmount)
                .depositStatus(depositStatus)
                .grossFineAmount(grossFineAmount)
                .depositAppliedAmount(depositAppliedAmount)
                .depositRefundAmount(depositRefundAmount)
                .additionalAmountDue(additionalAmountDue)
                .build();
        }
    }
}
