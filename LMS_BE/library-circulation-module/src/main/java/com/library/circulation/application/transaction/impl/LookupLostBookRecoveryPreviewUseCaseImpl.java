package com.library.circulation.application.transaction.impl;

import com.library.circulation.application.transaction.LookupLostBookRecoveryPreviewUseCase;
import com.library.circulation.dto.response.LostBookRecoveryPreviewResponse;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LookupLostBookRecoveryPreviewUseCaseImpl implements LookupLostBookRecoveryPreviewUseCase {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public LostBookRecoveryPreviewResponse execute(Long transactionId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
            SELECT
                t.id AS transaction_id,
                i.id AS item_id,
                i.barcode,
                i.status AS item_status,
                p.title AS publication_title,
                u.full_name AS borrower_name,
                u.student_id AS borrower_code,
                COALESCE(SUM(f.fine_amount) FILTER (WHERE f.type = 'LOST_BOOK'), 0) AS lost_fine_amount,
                COUNT(f.id) FILTER (WHERE f.type = 'LOST_BOOK') AS lost_fine_count,
                COALESCE(t.deposit_amount, 0) AS deposit_amount,
                COALESCE(t.deposit_applied_amount, 0) AS deposit_applied_amount,
                COALESCE(t.deposit_additional_amount_due, 0) AS additional_amount_due
            FROM borrowing_transactions t
            JOIN items i ON i.id = t.item_id
            JOIN publications p ON p.id = i.publication_id
            JOIN users u ON u.id = t.user_id
            LEFT JOIN fines f ON f.transaction_id = t.id
            WHERE t.id = :transactionId
            GROUP BY t.id, i.id, i.barcode, i.status, p.title, u.full_name, u.student_id,
                t.deposit_amount, t.deposit_applied_amount, t.deposit_additional_amount_due
            """, Map.of("transactionId", transactionId));

        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.TRANSACTION_NOT_FOUND);
        }

        Map<String, Object> row = rows.get(0);
        long lostFineCount = ((Number) row.get("lost_fine_count")).longValue();
        if (lostFineCount <= 0 || !"LOST".equals(row.get("item_status"))) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        BigDecimal lostFineAmount = positive((BigDecimal) row.get("lost_fine_amount"));
        BigDecimal depositAppliedAmount = positive((BigDecimal) row.get("deposit_applied_amount"));

        return LostBookRecoveryPreviewResponse.builder()
            .transactionId(((Number) row.get("transaction_id")).longValue())
            .itemId(((Number) row.get("item_id")).longValue())
            .publicationTitle((String) row.get("publication_title"))
            .barcode((String) row.get("barcode"))
            .itemStatus((String) row.get("item_status"))
            .borrowerName((String) row.get("borrower_name"))
            .borrowerCode((String) row.get("borrower_code"))
            .lostFineAmount(lostFineAmount)
            .depositAmount(positive((BigDecimal) row.get("deposit_amount")))
            .depositAppliedAmount(depositAppliedAmount)
            .additionalAmountDue(positive((BigDecimal) row.get("additional_amount_due")))
            .suggestedRefundAmount(lostFineAmount.max(depositAppliedAmount))
            .build();
    }

    private BigDecimal positive(BigDecimal value) {
        if (value == null || value.signum() < 0) return BigDecimal.ZERO;
        return value;
    }
}
