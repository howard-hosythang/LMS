package com.library.circulation.application.transaction.impl;

import com.library.circulation.application.transaction.GetStudentActiveTransactionsUseCase;
import com.library.circulation.domain.enums.TransactionStatus;
import com.library.circulation.dto.response.StudentActiveTransactionsResponse;
import com.library.circulation.dto.response.StudentActiveTransactionsResponse.ActiveItem;
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
public class GetStudentActiveTransactionsUseCaseImpl implements GetStudentActiveTransactionsUseCase {

    private static final String FIND_USER_SQL = """
        SELECT id, full_name FROM users
        WHERE student_id = :studentId AND status = 'ACTIVE'
        """;

    private static final String FIND_ACTIVE_SQL = """
        SELECT t.id AS transaction_id,
               p.title AS publication_title,
               i.barcode, i.branch, i.location,
               t.borrowed_date, t.due_date, t.status
        FROM borrowing_transactions t
        JOIN items i        ON i.id = t.item_id
        JOIN publications p ON p.id = i.publication_id
        WHERE t.user_id = :userId
          AND t.status IN ('BORROWING', 'OVERDUE')
        ORDER BY t.borrowed_date DESC
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    @Transactional(readOnly = true)
    public StudentActiveTransactionsResponse execute(String studentId) {
        List<Map<String, Object>> users = jdbcTemplate.queryForList(
            FIND_USER_SQL, Map.of("studentId", studentId.trim()));
        if (users.isEmpty()) throw new AppException(ErrorCode.USER_NOT_FOUND);

        Long userId = ((Number) users.get(0).get("id")).longValue();
        String fullName = (String) users.get(0).get("full_name");

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            FIND_ACTIVE_SQL, Map.of("userId", userId));

        List<ActiveItem> items = rows.stream().map(row -> ActiveItem.builder()
            .transactionId(((Number) row.get("transaction_id")).longValue())
            .publicationTitle((String) row.get("publication_title"))
            .barcode((String) row.get("barcode"))
            .branch((String) row.get("branch"))
            .location((String) row.get("location"))
            .borrowedDate(row.get("borrowed_date") != null
                ? ((java.sql.Timestamp) row.get("borrowed_date")).toInstant() : null)
            .dueDate(row.get("due_date") != null
                ? ((java.sql.Date) row.get("due_date")).toLocalDate() : null)
            .status(TransactionStatus.valueOf((String) row.get("status")))
            .build()
        ).toList();

        return StudentActiveTransactionsResponse.builder()
            .studentId(studentId)
            .fullName(fullName)
            .items(items)
            .build();
    }
}
