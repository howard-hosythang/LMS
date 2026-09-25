package com.library.circulation.application.fine.impl;

import com.library.circulation.application.fine.GetStudentFinesUseCase;
import com.library.circulation.domain.enums.PaymentStatus;
import com.library.circulation.dto.response.FineResponse;
import com.library.circulation.dto.response.StudentFinesResponse;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetStudentFinesUseCaseImpl implements GetStudentFinesUseCase {

    private static final String FIND_USER_SQL = """
        SELECT id, full_name FROM users
        WHERE student_id = :studentId AND status = 'ACTIVE'
        """;

    private static final String FIND_UNPAID_FINES_SQL = """
        SELECT f.id, f.transaction_id, f.fine_amount, f.type,
               f.payment_status, f.created_at, f.paid_date,
               p.title AS publication_title
        FROM fines f
        JOIN borrowing_transactions t ON t.id = f.transaction_id
        JOIN items i        ON i.id = t.item_id
        JOIN publications p ON p.id = i.publication_id
        WHERE t.user_id = :userId
          AND f.payment_status = 'UNPAID'
        ORDER BY f.created_at DESC
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    @Transactional(readOnly = true)
    public StudentFinesResponse execute(String studentId) {
        List<Map<String, Object>> users = jdbcTemplate.queryForList(
            FIND_USER_SQL, Map.of("studentId", studentId.trim()));
        if (users.isEmpty()) throw new AppException(ErrorCode.USER_NOT_FOUND);

        Long userId   = ((Number) users.get(0).get("id")).longValue();
        String fullName = (String) users.get(0).get("full_name");

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            FIND_UNPAID_FINES_SQL, Map.of("userId", userId));

        List<FineResponse> fines = rows.stream().map(this::toResponse).toList();
        BigDecimal total = fines.stream()
            .map(FineResponse::getFineAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return StudentFinesResponse.builder()
            .studentId(studentId)
            .fullName(fullName)
            .totalUnpaidAmount(total)
            .fines(fines)
            .build();
    }

    private FineResponse toResponse(Map<String, Object> row) {
        return FineResponse.builder()
            .fineId(((Number) row.get("id")).longValue())
            .transactionId(((Number) row.get("transaction_id")).longValue())
            .publicationTitle((String) row.get("publication_title"))
            .fineAmount((BigDecimal) row.get("fine_amount"))
            .type(com.library.user.domain.enums.ViolationType.valueOf((String) row.get("type")))
            .status(PaymentStatus.valueOf((String) row.get("payment_status")))
            .createdAt(row.get("created_at") != null ? ((Timestamp) row.get("created_at")).toInstant() : null)
            .paidDate(row.get("paid_date") != null ? ((Timestamp) row.get("paid_date")).toInstant() : null)
            .build();
    }
}
