package com.library.circulation.application.fine.impl;

import com.library.circulation.application.fine.GetMyFinesUseCase;
import com.library.circulation.domain.enums.PaymentStatus;
import com.library.circulation.dto.response.FineResponse;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetMyFinesUseCaseImpl implements GetMyFinesUseCase {

    private static final String COUNT_SQL = """
        SELECT COUNT(*)
        FROM fines f
        JOIN borrowing_transactions t ON t.id = f.transaction_id
        WHERE t.user_id = :userId
          AND (CAST(:status AS TEXT) IS NULL OR f.payment_status = :status)
        """;

    private static final String LIST_SQL = """
        SELECT f.id, f.transaction_id, f.fine_amount, f.type,
               f.payment_status, f.created_at, f.paid_date,
               p.title AS publication_title
        FROM fines f
        JOIN borrowing_transactions t ON t.id = f.transaction_id
        JOIN items i        ON i.id = t.item_id
        JOIN publications p ON p.id = i.publication_id
        WHERE t.user_id = :userId
          AND (CAST(:status AS TEXT) IS NULL OR f.payment_status = :status)
        ORDER BY f.created_at DESC
        LIMIT :size OFFSET :offset
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    @Transactional(readOnly = true)
    public com.library.shared.dto.PageResponse<FineResponse> execute(Long userId, String status, int page, int size) {
        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("status", status != null ? status.toUpperCase() : null);
        params.put("size", size);
        params.put("offset", (long) page * size);

        Long total = jdbcTemplate.queryForObject(COUNT_SQL, params, Long.class);
        long totalCount = total != null ? total : 0L;

        List<FineResponse> content = new ArrayList<>();
        if (totalCount > 0) {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(LIST_SQL, params);
            content = rows.stream().map(row -> FineResponse.builder()
                .fineId(((Number) row.get("id")).longValue())
                .transactionId(((Number) row.get("transaction_id")).longValue())
                .publicationTitle((String) row.get("publication_title"))
                .fineAmount((BigDecimal) row.get("fine_amount"))
                .type(com.library.user.domain.enums.ViolationType.valueOf((String) row.get("type")))
                .status(PaymentStatus.valueOf((String) row.get("payment_status")))
                .createdAt(row.get("created_at") != null ? ((Timestamp) row.get("created_at")).toInstant() : null)
                .paidDate(row.get("paid_date") != null ? ((Timestamp) row.get("paid_date")).toInstant() : null)
                .build()
            ).toList();
        }

        int totalPages = (int) Math.ceil((double) totalCount / size);
        return com.library.shared.dto.PageResponse.<FineResponse>builder()
            .content(content)
            .currentPage(page)
            .pageSize(size)
            .totalElements(totalCount)
            .totalPages(totalPages)
            .isFirst(page == 0)
            .isLast(page >= totalPages - 1)
            .build();
    }
}
