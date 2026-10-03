package com.library.circulation.application.transaction.impl;

import com.library.circulation.application.transaction.GetAllBorrowingTransactionUseCase;
import com.library.circulation.domain.enums.PaymentStatus;
import com.library.circulation.domain.enums.TransactionStatus;
import com.library.circulation.dto.response.TransactionListResponse;
import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetAllBorrowingTransactionUseCaseImpl implements GetAllBorrowingTransactionUseCase {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    public com.library.shared.dto.PageResponse<TransactionListResponse> execute(
        int page,
        int size,
        String keyword,
        String status,
        String fineStatus,
        String dateFrom,
        String dateTo,
        String sortBy,
        String sortDir
    ) {
        return search(page, size, keyword, status, fineStatus, dateFrom, dateTo, sortBy, sortDir,
            "BORROWED", null, null, null, null);
    }

    @Override
    public com.library.shared.dto.PageResponse<TransactionListResponse> search(
        int page, int size, String keyword, String status, String fineStatus,
        String dateFrom, String dateTo, String sortBy, String sortDir,
        String dateType, Long userId, Long itemId, Long transactionId, String scope) {
        String dateColumn = switch (dateType == null ? "BORROWED" : dateType.toUpperCase()) {
            case "BORROWED" -> "t.borrowed_date";
            case "RETURNED" -> "t.returned_date";
            default -> throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Invalid dateType");
        };
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        String normalizedStatus = normalizeEnum(status);
        String normalizedFineStatus = normalizeEnum(fineStatus);

        Instant fromInstant;
        Instant toInstantExclusive;
        try {
            fromInstant = parseDateStart(dateFrom);
            toInstantExclusive = parseDateEndExclusive(dateTo);
        } catch (java.time.format.DateTimeParseException error) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Invalid date", error);
        }
        if (fromInstant != null && toInstantExclusive != null && !fromInstant.isBefore(toInstantExclusive))
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Invalid date range");

        MapSqlParameterSource params = new MapSqlParameterSource()
            .addValue("keyword", normalizedKeyword, Types.VARCHAR)
            .addValue("limit", safeSize)
            .addValue("offset", (long) safePage * safeSize);

        StringBuilder baseFromWhere = new StringBuilder("""
            FROM borrowing_transactions t
            LEFT JOIN items i ON i.id = t.item_id
            LEFT JOIN publications p ON p.id = i.publication_id
            LEFT JOIN LATERAL (
              SELECT STRING_AGG(a.name, ', ' ORDER BY a.name, a.id) AS authors
              FROM publication_authors pa JOIN authors a ON a.id = pa.author_id
              WHERE pa.publication_id = p.id
            ) pa ON TRUE
            LEFT JOIN users u ON u.id = t.user_id
            LEFT JOIN users issue_librarian ON issue_librarian.id = t.librarian_id_issue
            LEFT JOIN users return_librarian ON return_librarian.id = t.librarian_id_return
            LEFT JOIN LATERAL (
              SELECT
                COALESCE(SUM(fine_amount), 0) AS fine_amount,
                COUNT(*) AS fine_count,
                COUNT(*) FILTER (WHERE payment_status = 'UNPAID') AS unpaid_count,
                STRING_AGG(DISTINCT type, ', ') FILTER (WHERE type IS NOT NULL) AS fine_types,
                MAX(paid_by_librarian_id) FILTER (WHERE paid_by_librarian_id IS NOT NULL) AS paid_by_librarian_id
              FROM fines
              WHERE transaction_id = t.id
            ) fa ON TRUE
            LEFT JOIN users fine_librarian ON fine_librarian.id = fa.paid_by_librarian_id
            LEFT JOIN LATERAL (
              SELECT
                BOOL_OR(important) AS important,
                STRING_AGG(
                  CONCAT(
                    COALESCE(lu.full_name, 'Thủ thư'),
                    CASE WHEN lu.student_id IS NULL OR lu.student_id = '' THEN '' ELSE CONCAT(' (', lu.student_id, ')') END,
                    ': ',
                    COALESCE(tn.note, '')
                  ),
                  E'\n'
                  ORDER BY tn.created_at ASC, tn.id ASC
                ) AS note
              FROM transaction_notes tn
              LEFT JOIN users lu ON lu.id = tn.librarian_id
              WHERE tn.transaction_id = t.id
            ) tn ON TRUE
            WHERE (:keyword = ''
                OR LOWER(u.full_name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(u.student_id) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(i.barcode) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR CAST(t.id AS TEXT) LIKE CONCAT('%', :keyword, '%'))
            """);

        if (normalizedStatus != null) {
            baseFromWhere.append(" AND t.status = :status");
            params.addValue("status", normalizedStatus, Types.VARCHAR);
        }
        if (fromInstant != null) {
            baseFromWhere.append(" AND " + dateColumn + " >= :dateFrom");
            params.addValue("dateFrom", Timestamp.from(fromInstant));
        }
        if (toInstantExclusive != null) {
            baseFromWhere.append(" AND " + dateColumn + " < :dateTo");
            params.addValue("dateTo", Timestamp.from(toInstantExclusive));
        }

        if (userId != null) { baseFromWhere.append(" AND t.user_id = :userId"); params.addValue("userId", userId); }
        if (itemId != null) { baseFromWhere.append(" AND t.item_id = :itemId"); params.addValue("itemId", itemId); }
        if (transactionId != null) { baseFromWhere.append(" AND t.id = :transactionId"); params.addValue("transactionId", transactionId); }
        if ("ACTIVE".equals(scope)) baseFromWhere.append(" AND t.status IN ('BORROWING', 'OVERDUE')");
        else if ("RETURNED".equals(scope)) baseFromWhere.append(" AND t.status = 'RETURNED'");
        else if (scope != null) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Invalid scope");
        if ("UNPAID".equals(normalizedFineStatus)) {
            baseFromWhere.append(" AND COALESCE(fa.unpaid_count, 0) > 0");
        } else if ("PAID".equals(normalizedFineStatus)) {
            baseFromWhere.append(" AND COALESCE(fa.fine_count, 0) > 0 AND COALESCE(fa.unpaid_count, 0) = 0");
        }

        String sql = """
            SELECT
              t.id AS transaction_id,
              t.user_id,
              u.full_name,
              u.student_id,
              u.email,
              u.phone_number,
              i.barcode,
              i.id AS item_id, p.id AS publication_id, p.title AS publication_title,
              p.cover_image_url, pa.authors, i.branch, i.location,
              COALESCE(fa.fine_amount, 0) AS fine_amount,
              COALESCE(t.deposit_gross_fine_amount, COALESCE(fa.fine_amount, 0)) AS gross_fine_amount,
              COALESCE(t.deposit_amount, 0) AS deposit_amount,
              t.deposit_status,
              COALESCE(t.deposit_applied_amount, 0) AS deposit_applied_amount,
              COALESCE(t.deposit_refund_amount, 0) AS deposit_refund_amount,
              COALESCE(t.deposit_additional_amount_due, 0) AS additional_amount_due,
              fa.fine_types,
              CASE
                WHEN COALESCE(fa.fine_count, 0) = 0 THEN NULL
                WHEN COALESCE(fa.unpaid_count, 0) > 0 THEN 'UNPAID'
                ELSE 'PAID'
              END AS fine_payment_status,
              COALESCE(tn.important, FALSE) AS important,
              tn.note,
              t.created_at,
              t.borrowed_date,
              issue_librarian.full_name AS issue_librarian_name,
              issue_librarian.student_id AS issue_librarian_code,
              t.due_date,
              t.returned_date,
              return_librarian.full_name AS return_librarian_name,
              return_librarian.student_id AS return_librarian_code,
              fine_librarian.full_name AS fine_paid_by_librarian_name,
              fine_librarian.student_id AS fine_paid_by_librarian_code,
              t.status
            """ + baseFromWhere + " ORDER BY " + resolveSort(sortBy) + " " + resolveDirection(sortDir) + " NULLS LAST, t.id DESC LIMIT :limit OFFSET :offset";

        String countSql = "SELECT COUNT(*) FROM (SELECT t.id " + baseFromWhere + ") counted";

        List<TransactionListResponse> content = jdbcTemplate.query(sql, params, (rs, rowNum) ->
            TransactionListResponse.builder()
                .transactionId(rs.getLong("transaction_id"))
                .userId(rs.getLong("user_id"))
                .fullName(rs.getString("full_name"))
                .studentId(rs.getString("student_id"))
                .email(rs.getString("email"))
                .phoneNumber(rs.getString("phone_number"))
                .barcode(rs.getString("barcode"))
                .itemId((Long) rs.getObject("item_id"))
                .publicationId((Long) rs.getObject("publication_id"))
                .publicationTitle(rs.getString("publication_title"))
                .coverImageUrl(rs.getString("cover_image_url"))
                .authors(rs.getString("authors"))
                .branch(rs.getString("branch"))
                .location(rs.getString("location"))
                .fineAmount((BigDecimal) rs.getObject("fine_amount"))
                .grossFineAmount((BigDecimal) rs.getObject("gross_fine_amount"))
                .finePaymentStatus(toPaymentStatus(rs.getString("fine_payment_status")))
                .fineTypes(rs.getString("fine_types"))
                .depositAmount((BigDecimal) rs.getObject("deposit_amount"))
                .depositStatus(rs.getString("deposit_status"))
                .depositAppliedAmount((BigDecimal) rs.getObject("deposit_applied_amount"))
                .depositRefundAmount((BigDecimal) rs.getObject("deposit_refund_amount"))
                .additionalAmountDue((BigDecimal) rs.getObject("additional_amount_due"))
                .important(rs.getBoolean("important"))
                .note(rs.getString("note"))
                .createdAt(toInstant(rs.getTimestamp("created_at")))
                .borrowedDate(toInstant(rs.getTimestamp("borrowed_date")))
                .issueLibrarianName(rs.getString("issue_librarian_name"))
                .issueLibrarianCode(rs.getString("issue_librarian_code"))
                .dueDate(toLocalDate(rs.getDate("due_date")))
                .returnedDate(toInstant(rs.getTimestamp("returned_date")))
                .returnLibrarianName(rs.getString("return_librarian_name"))
                .returnLibrarianCode(rs.getString("return_librarian_code"))
                .finePaidByLibrarianName(rs.getString("fine_paid_by_librarian_name"))
                .finePaidByLibrarianCode(rs.getString("fine_paid_by_librarian_code"))
                .status(TransactionStatus.valueOf(rs.getString("status")))
                .build()
        );

        long totalElements = jdbcTemplate.queryForObject(countSql, params, Long.class);
        int totalPages = (int) Math.ceil((double) totalElements / safeSize);

        return com.library.shared.dto.PageResponse.<TransactionListResponse>builder()
            .content(content)
            .currentPage(safePage)
            .pageSize(safeSize)
            .totalElements(totalElements)
            .totalPages(totalPages)
            .isFirst(safePage == 0)
            .isLast(totalPages == 0 || safePage >= totalPages - 1)
            .build();
    }

    private String resolveSort(String sortBy) {
        return switch (sortBy == null ? "" : sortBy) {
            case "borrowedDate" -> "t.borrowed_date";
            case "returnedDate" -> "t.returned_date";
            case "dueDate" -> "t.due_date";
            case "fineAmount" -> "fine_amount";
            default -> "t.created_at";
        };
    }

    private String resolveDirection(String sortDir) {
        return "ASC".equalsIgnoreCase(sortDir) ? "ASC" : "DESC";
    }

    private String normalizeEnum(String value) {
        if (value == null || value.isBlank() || "ALL".equalsIgnoreCase(value)) return null;
        return value.trim().toUpperCase();
    }

    private Instant parseDateStart(String value) {
        if (value == null || value.isBlank()) return null;
        return LocalDate.parse(value).atStartOfDay(ZONE).toInstant();
    }

    private Instant parseDateEndExclusive(String value) {
        if (value == null || value.isBlank()) return null;
        return LocalDate.parse(value).plusDays(1).atStartOfDay(ZONE).toInstant();
    }

    private Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }

    private LocalDate toLocalDate(Date date) {
        return date == null ? null : date.toLocalDate();
    }

    private PaymentStatus toPaymentStatus(String value) {
        return value == null ? null : PaymentStatus.valueOf(value);
    }
}
