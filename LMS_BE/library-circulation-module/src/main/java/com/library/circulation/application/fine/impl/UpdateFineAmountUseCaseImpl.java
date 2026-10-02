package com.library.circulation.application.fine.impl;

import com.library.circulation.application.fine.UpdateFineAmountUseCase;
import com.library.circulation.dto.request.UpdateFineAmountRequest;
import com.library.shared.constant.RoleConstants;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.service.AuditLogService;
import java.math.BigDecimal;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UpdateFineAmountUseCaseImpl implements UpdateFineAmountUseCase {
    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public BigDecimal execute(Long fineId, Long librarianId, UpdateFineAmountRequest request) {
        BigDecimal amount = request.fineAmount();
        if (amount == null || amount.compareTo(BigDecimal.ONE) < 0
            || amount.compareTo(new BigDecimal("10000000")) > 0
            || amount.stripTrailingZeros().scale() > 0
            || (request.reason() != null && request.reason().length() > 500)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        var rows = jdbcTemplate.queryForList("""
            SELECT id, transaction_id, fine_amount, payment_status
            FROM fines WHERE id = :fineId FOR UPDATE
            """, Map.of("fineId", fineId));
        if (rows.isEmpty()) throw new AppException(ErrorCode.FINE_NOT_FOUND);
        var fine = rows.get(0);
        if (!"UNPAID".equals(fine.get("payment_status"))) {
            throw new AppException(ErrorCode.FINE_ALREADY_PAID);
        }
        Boolean pendingPayment = jdbcTemplate.queryForObject("""
            SELECT EXISTS (
                SELECT 1 FROM fine_payment_orders o
                JOIN fine_payment_order_fines ofi ON ofi.order_id = o.id
                WHERE ofi.fine_id = :fineId AND o.status = 'PENDING'
            )
            """, Map.of("fineId", fineId), Boolean.class);
        if (Boolean.TRUE.equals(pendingPayment)) {
            throw new AppException(ErrorCode.FINE_PAYMENT_IN_PROGRESS);
        }
        BigDecimal oldAmount = (BigDecimal) fine.get("fine_amount");
        Long transactionId = ((Number) fine.get("transaction_id")).longValue();
        // Serialize adjustments of different fines belonging to the same loan so
        // the settlement snapshot cannot miss a concurrent adjustment.
        jdbcTemplate.queryForObject("SELECT id FROM borrowing_transactions WHERE id = :transactionId FOR UPDATE",
            Map.of("transactionId", transactionId), Long.class);
        jdbcTemplate.update("""
            UPDATE fines SET fine_amount = :amount, updated_at = NOW()
            WHERE id = :fineId AND payment_status = 'UNPAID'
            """, Map.of("fineId", fineId, "amount", amount));
        // A settled fine may already be reduced by a deposit. Adjust the remaining debt,
        // never re-apply the deposit or rewrite amounts actually refunded/collected.
        jdbcTemplate.update("""
            UPDATE borrowing_transactions t
            SET deposit_gross_fine_amount = GREATEST(0, deposit_gross_fine_amount + :delta),
                deposit_additional_amount_due = (
                    SELECT COALESCE(SUM(f.fine_amount), 0) FROM fines f
                    WHERE f.transaction_id = t.id AND f.payment_status = 'UNPAID'
                ),
                updated_at = NOW()
            WHERE t.id = :transactionId AND t.deposit_settled_at IS NOT NULL
            """, Map.of("transactionId", transactionId, "delta", amount.subtract(oldAmount)));
        auditLogService.log(librarianId, RoleConstants.LIBRARIAN, "UPDATE_FINE_AMOUNT", "fines", fineId,
            "Librarian adjusted an unpaid fine",
            Map.of("transactionId", transactionId, "oldAmount", oldAmount, "newAmount", amount,
                "reason", request.reason() == null ? "" : request.reason().trim()));
        return amount;
    }
}
