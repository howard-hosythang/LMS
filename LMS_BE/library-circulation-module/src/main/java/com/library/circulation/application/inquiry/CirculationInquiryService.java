package com.library.circulation.application.inquiry;

import com.library.circulation.application.transaction.GetAllBorrowingTransactionUseCase;
import com.library.circulation.dto.response.TransactionListResponse;
import com.library.shared.dto.PageResponse;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Read model only: no borrowing, payment or inventory mutations. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CirculationInquiryService {
    private final NamedParameterJdbcTemplate jdbc;
    private final GetAllBorrowingTransactionUseCase transactions;
    public record TransactionDetail(TransactionListResponse transaction, List<Map<String, Object>> fines) {}
    public record PublicationOverview(Map<String, Object> publication, Map<String, Object> counts,
        PageResponse<Map<String, Object>> copies) {}

    private static final String AUTHORS = """
        (SELECT STRING_AGG(a.name, ', ' ORDER BY a.name, a.id)
         FROM publication_authors pa JOIN authors a ON a.id = pa.author_id
         WHERE pa.publication_id = p.id)
        """;
    private static final String COPY_FROM = """
        FROM items i JOIN publications p ON p.id = i.publication_id
        LEFT JOIN LATERAL (
            SELECT t.id, t.user_id, t.due_date, u.full_name, u.student_id
            FROM borrowing_transactions t LEFT JOIN users u ON u.id = t.user_id
            WHERE t.item_id = i.id AND t.status IN ('BORROWING', 'OVERDUE')
            ORDER BY t.created_at DESC, t.id DESC LIMIT 1
        ) holder ON TRUE
        """;
    private static final String COPY_SELECT = """
        SELECT i.id::text AS "itemId", i.publication_id::text AS "publicationId",
            p.title AS "publicationTitle", p.cover_image_url AS "coverImageUrl",
            i.barcode, i.branch, i.location, i.status, i.condition,
            i.acquired_date AS "acquiredDate", i.created_at AS "createdAt",
            holder.id::text AS "transactionId", holder.user_id::text AS "holderUserId",
            holder.full_name AS "holderName", holder.student_id AS "holderStudentId",
            holder.due_date AS "dueDate",
            EXISTS(SELECT 1 FROM reshelving_tasks q WHERE q.item_id = i.id AND q.status = 'WAITING') AS "waitingReshelving"
        """;

    public List<Map<String, Object>> readers(String keyword) {
        if (keyword == null || keyword.isBlank()) return List.of();
        return rows("""
            SELECT u.id::text AS "userId", u.full_name AS "fullName", u.student_id AS "studentId"
            FROM users u
            WHERE (LOWER(u.full_name) LIKE :keyword OR LOWER(u.student_id) LIKE :keyword)
              AND EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                         WHERE ur.user_id = u.id AND r.role_name IN ('STUDENT', 'LECTURER'))
            ORDER BY u.full_name, u.id LIMIT 20
            """, new MapSqlParameterSource("keyword", "%" + keyword.trim().toLowerCase(java.util.Locale.ROOT) + "%"));
    }

    public List<Map<String, Object>> publications(String keyword, String branch) {
        if (keyword == null || keyword.isBlank()) return List.of();
        return rows("SELECT p.id::text AS \"publicationId\", p.title AS \"publicationTitle\", p.cover_image_url AS \"coverImageUrl\", "
            + AUTHORS + " AS authors FROM publications p WHERE (LOWER(p.title) LIKE :keyword OR EXISTS(SELECT 1 FROM items b WHERE b.publication_id = p.id AND LOWER(b.barcode) LIKE :keyword))"
            + " AND (:branch IS NULL OR EXISTS(SELECT 1 FROM items b WHERE b.publication_id = p.id AND b.branch = :branch)) ORDER BY p.title, p.id LIMIT 20",
            branchParams(branch).addValue("keyword", "%" + keyword.trim().toLowerCase(java.util.Locale.ROOT) + "%"));
    }

    public Map<String, Object> item(Long id) {
        return one(rows(COPY_SELECT + ", " + AUTHORS + " AS authors " + COPY_FROM + " WHERE i.id = :id", new MapSqlParameterSource("id", id)));
    }

    public Map<String, Object> barcode(String barcode) {
        return one(rows(COPY_SELECT + ", " + AUTHORS + " AS authors " + COPY_FROM + " WHERE i.barcode = :barcode", new MapSqlParameterSource("barcode", barcode)));
    }

    public PublicationOverview publication(Long id, String branch, int page, int size) {
        var params = branchParams(branch).addValue("id", id);
        var publication = one(rows("SELECT p.id::text AS \"publicationId\", p.title AS \"publicationTitle\", p.cover_image_url AS \"coverImageUrl\", " + AUTHORS + " AS authors FROM publications p WHERE p.id = :id", params));
        String where = " WHERE i.publication_id = :id AND (:branch IS NULL OR i.branch = :branch)";
        var counts = one(rows("""
            SELECT COUNT(*) AS total,
                COUNT(*) FILTER(WHERE i.status = 'AVAILABLE') AS available,
                COUNT(*) FILTER(WHERE i.status = 'AVAILABLE' AND EXISTS(SELECT 1 FROM reshelving_tasks q WHERE q.item_id = i.id AND q.status = 'WAITING')) AS waiting,
                COUNT(*) FILTER(WHERE i.status = 'AVAILABLE' AND NOT EXISTS(SELECT 1 FROM reshelving_tasks q WHERE q.item_id = i.id AND q.status = 'WAITING')) AS ready,
                COUNT(*) FILTER(WHERE i.status = 'BORROWED') AS borrowed,
                COUNT(*) FILTER(WHERE i.status = 'RESERVED') AS reserved,
                COUNT(*) FILTER(WHERE i.status = 'IN_MAINTENANCE') AS maintenance,
                COUNT(*) FILTER(WHERE i.status = 'LOST') AS lost FROM items i
            """ + where, params));
        return new PublicationOverview(publication, counts,
            page(COPY_SELECT + ", " + AUTHORS + " AS authors " + COPY_FROM + where, "SELECT COUNT(*) FROM items i" + where, "i.branch, i.location NULLS LAST, i.id", params, page, size));
    }

    public TransactionDetail transaction(Long id) {
        var result = transactions.search(0, 1, null, null, null, null, null, null, null, "BORROWED", null, null, id, null);
        if (result.getContent().isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found");
        return new TransactionDetail(result.getContent().get(0), rows("""
            SELECT f.id::text AS "fineId", f.type, f.fine_amount AS "fineAmount",
                f.payment_status AS status, f.created_at AS "createdAt", f.paid_date AS "paidDate",
                u.full_name AS "paidByName", u.student_id AS "paidByCode"
            FROM fines f LEFT JOIN users u ON u.id = f.paid_by_librarian_id
            WHERE f.transaction_id = :id ORDER BY f.created_at, f.id
            """, new MapSqlParameterSource("id", id)));
    }

    public PageResponse<Map<String, Object>> timeline(Long id, int page, int size) {
        item(id); // Unknown copies must not look like an empty history.
        String events = """
            SELECT * FROM (
              SELECT 'acquired-' || i.id AS id, 'ACQUIRED' AS type,
                i.acquired_date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh' AS occurred,
                TRUE AS "dateOnly", NULL::text AS "transactionId", NULL::text AS detail,
                NULL::numeric AS amount, NULL::text AS "actorName", NULL::text AS "actorCode"
              FROM items i WHERE i.id = :id AND i.acquired_date IS NOT NULL
              UNION ALL
              SELECT 'request-' || t.id, 'REQUEST', t.created_at, FALSE, t.id::text, NULL, NULL, NULL, NULL
              FROM borrowing_transactions t WHERE t.item_id = :id AND t.created_at IS NOT NULL
              UNION ALL
              SELECT 'issue-' || t.id, 'ISSUE', t.borrowed_date, FALSE, t.id::text, NULL, NULL, u.full_name, u.student_id
              FROM borrowing_transactions t LEFT JOIN users u ON u.id = t.librarian_id_issue WHERE t.item_id = :id AND t.borrowed_date IS NOT NULL
              UNION ALL
              SELECT 'return-' || t.id, 'RETURN', t.returned_date, FALSE, t.id::text, NULL, NULL, u.full_name, u.student_id
              FROM borrowing_transactions t LEFT JOIN users u ON u.id = t.librarian_id_return WHERE t.item_id = :id AND t.returned_date IS NOT NULL
              UNION ALL
              SELECT 'fine-' || f.id, 'FINE_CREATED', f.created_at, FALSE, t.id::text, f.type, f.fine_amount, NULL, NULL
              FROM fines f JOIN borrowing_transactions t ON t.id = f.transaction_id WHERE t.item_id = :id AND f.created_at IS NOT NULL
              UNION ALL
              SELECT 'paid-' || f.id, 'FINE_PAID', f.paid_date, FALSE, t.id::text, f.type, f.fine_amount, u.full_name, u.student_id
              FROM fines f JOIN borrowing_transactions t ON t.id = f.transaction_id LEFT JOIN users u ON u.id = f.paid_by_librarian_id WHERE t.item_id = :id AND f.paid_date IS NOT NULL
              UNION ALL
              SELECT 'queue-' || q.id, 'RESHELVING_QUEUED', q.queued_at, FALSE, q.transaction_id::text, q.source, NULL, NULL, NULL
              FROM reshelving_tasks q WHERE q.item_id = :id
              UNION ALL
              SELECT 'shelved-' || q.id, 'SHELVED', q.shelved_at, FALSE, q.transaction_id::text, q.source, NULL, u.full_name, u.student_id
              FROM reshelving_tasks q LEFT JOIN users u ON u.id = q.shelved_by_librarian_id WHERE q.item_id = :id AND q.shelved_at IS NOT NULL
              UNION ALL
              SELECT 'note-' || n.id, 'NOTE', n.created_at, FALSE, t.id::text, n.note, NULL, u.full_name, u.student_id
              FROM transaction_notes n JOIN borrowing_transactions t ON t.id = n.transaction_id LEFT JOIN users u ON u.id = n.librarian_id WHERE t.item_id = :id AND n.created_at IS NOT NULL
            ) events
            """;
        return page("SELECT id, type, occurred AS \"occurredAt\", \"dateOnly\", \"transactionId\", detail, amount, \"actorName\", \"actorCode\" FROM (" + events + ") timeline",
            "SELECT COUNT(*) FROM (" + events + ") counted", "\"occurredAt\" DESC, id DESC", new MapSqlParameterSource("id", id), page, size);
    }

    private PageResponse<Map<String, Object>> page(String sql, String countSql, String order, MapSqlParameterSource params, int page, int size) {
        int safePage = Math.max(0, page), safeSize = Math.min(100, Math.max(1, size));
        params.addValue("limit", safeSize).addValue("offset", (long) safePage * safeSize);
        long total = jdbc.queryForObject(countSql, params, Long.class);
        int pages = (int) Math.ceil((double) total / safeSize);
        return PageResponse.<Map<String, Object>>builder().content(rows(sql + " ORDER BY " + order + " LIMIT :limit OFFSET :offset", params))
            .currentPage(safePage).pageSize(safeSize).totalElements(total).totalPages(pages).isFirst(safePage == 0).isLast(pages == 0 || safePage >= pages - 1).build();
    }

    private MapSqlParameterSource branchParams(String branch) {
        if (branch != null && !List.of("Cơ sở 1 - Lý Thường Kiệt", "Cơ sở 2 - Dĩ An").contains(branch))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid branch");
        return new MapSqlParameterSource().addValue("branch", branch, Types.VARCHAR);
    }

    private Map<String, Object> one(List<Map<String, Object>> rows) {
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found");
        return rows.get(0);
    }

    private List<Map<String, Object>> rows(String sql, MapSqlParameterSource params) {
        var result = jdbc.queryForList(sql, params);
        result.forEach(row -> row.replaceAll((key, value) -> value instanceof Timestamp ts ? ts.toInstant().toString()
            : value instanceof java.sql.Date date ? date.toLocalDate().toString()
            : value instanceof java.time.OffsetDateTime date ? date.toInstant().toString() : value));
        return result;
    }
}
