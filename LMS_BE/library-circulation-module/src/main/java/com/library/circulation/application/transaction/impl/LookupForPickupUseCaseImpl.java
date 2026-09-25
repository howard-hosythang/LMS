package com.library.circulation.application.transaction.impl;

import com.library.circulation.application.transaction.LookupForPickupUseCase;
import com.library.circulation.domain.enums.TransactionStatus;
import com.library.circulation.dto.response.LookupTransactionResponse;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LookupForPickupUseCaseImpl implements LookupForPickupUseCase {

    private static final String BY_TRANSACTION_ID_SQL = """
        SELECT t.id AS transaction_id, t.user_id, t.item_id, t.picked_up_deadline, t.status,
               t.deposit_amount, t.deposit_status,
               u.student_id, u.full_name,
               i.barcode, i.branch, i.location, i.publication_id,
               p.title AS publication_title
        FROM borrowing_transactions t
        JOIN users u        ON u.id = t.user_id
        JOIN items i        ON i.id = t.item_id
        JOIN publications p ON p.id = i.publication_id
        WHERE t.id = :transactionId
          AND t.status = 'WAITING_FOR_PICKUP'
        """;

    private static final String BY_STUDENT_AND_BARCODE_SQL = """
        SELECT t.id AS transaction_id, t.user_id, t.item_id, t.picked_up_deadline, t.status,
               t.deposit_amount, t.deposit_status,
               u.student_id, u.full_name,
               i.barcode, i.branch, i.location, i.publication_id,
               p.title AS publication_title
        FROM borrowing_transactions t
        JOIN users u        ON u.id = t.user_id
        JOIN items i        ON i.id = t.item_id
        JOIN publications p ON p.id = i.publication_id
        WHERE u.student_id = :studentId
          AND i.barcode    = :barcode
          AND t.status     = 'WAITING_FOR_PICKUP'
        ORDER BY t.created_at DESC
        LIMIT 1
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    @Transactional(readOnly = true)
    public LookupTransactionResponse execute(Long transactionId, String studentId, String barcode) {
        List<Map<String, Object>> rows;

        if (transactionId != null) {
            rows = jdbcTemplate.queryForList(BY_TRANSACTION_ID_SQL,
                Map.of("transactionId", transactionId));
        } else if (studentId != null && barcode != null) {
            MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("studentId", studentId)
                .addValue("barcode", barcode);
            rows = jdbcTemplate.queryForList(BY_STUDENT_AND_BARCODE_SQL, params);
        } else {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.TRANSACTION_NOT_FOUND);
        }

        Map<String, Object> row = rows.get(0);
        return LookupTransactionResponse.builder()
            .transactionId(((Number) row.get("transaction_id")).longValue())
            .userId(((Number) row.get("user_id")).longValue())
            .studentId((String) row.get("student_id"))
            .fullName((String) row.get("full_name"))
            .itemId(((Number) row.get("item_id")).longValue())
            .barcode((String) row.get("barcode"))
            .publicationId(((Number) row.get("publication_id")).longValue())
            .publicationTitle((String) row.get("publication_title"))
            .branch((String) row.get("branch"))
            .location((String) row.get("location"))
            .pickedUpDeadline(row.get("picked_up_deadline") != null
                ? ((java.sql.Timestamp) row.get("picked_up_deadline")).toInstant() : null)
            .status(TransactionStatus.valueOf((String) row.get("status")))
            .depositAmount((java.math.BigDecimal) row.get("deposit_amount"))
            .depositStatus((String) row.get("deposit_status"))
            .build();
    }
}
