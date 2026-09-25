package com.library.circulation.application.transaction.impl;

import com.library.circulation.application.transaction.LookupActiveTransactionUseCase;
import com.library.circulation.domain.enums.TransactionStatus;
import com.library.circulation.dto.response.ActiveTransactionResponse;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LookupActiveTransactionUseCaseImpl implements LookupActiveTransactionUseCase {

    private static final String SQL = """
        SELECT t.id AS transaction_id, t.user_id,
               t.borrowed_date, t.due_date, t.status,
               t.deposit_amount, t.deposit_status,
               u.student_id, u.full_name,
               i.barcode, i.branch, i.location,
               p.title AS publication_title
        FROM borrowing_transactions t
        JOIN users u        ON u.id = t.user_id
        JOIN items i        ON i.id = t.item_id
        JOIN publications p ON p.id = i.publication_id
        WHERE i.barcode  = :barcode
          AND t.status IN ('BORROWING', 'OVERDUE')
        ORDER BY t.borrowed_date DESC
        LIMIT 1
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    @Transactional(readOnly = true)
    public ActiveTransactionResponse execute(String barcode) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SQL, Map.of("barcode", barcode));

        if (rows.isEmpty()) throw new AppException(ErrorCode.TRANSACTION_NOT_FOUND);

        Map<String, Object> row = rows.get(0);
        return ActiveTransactionResponse.builder()
            .transactionId(((Number) row.get("transaction_id")).longValue())
            .userId(((Number) row.get("user_id")).longValue())
            .studentId((String) row.get("student_id"))
            .fullName((String) row.get("full_name"))
            .publicationTitle((String) row.get("publication_title"))
            .barcode((String) row.get("barcode"))
            .branch((String) row.get("branch"))
            .location((String) row.get("location"))
            .borrowedDate(row.get("borrowed_date") != null
                ? ((java.sql.Timestamp) row.get("borrowed_date")).toInstant() : null)
            .dueDate(row.get("due_date") != null
                ? ((java.sql.Date) row.get("due_date")).toLocalDate() : null)
            .status(TransactionStatus.valueOf((String) row.get("status")))
            .depositAmount((java.math.BigDecimal) row.get("deposit_amount"))
            .depositStatus((String) row.get("deposit_status"))
            .build();
    }
}
