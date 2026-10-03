package com.library.circulation.application.reshelving;

import com.library.circulation.dto.response.ReshelvingItemResponse;
import com.library.shared.constant.RoleConstants;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.service.AuditLogService;
import com.library.shared.util.TsIdGenerator;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReshelvingService {
    public enum Source { RETURN, PICKUP_EXPIRED, RESERVATION_EXPIRED, RESERVATION_CANCELLED, LOST_RECOVERED }
    private final NamedParameterJdbcTemplate jdbc;
    private final AuditLogService audit;

    @Transactional(readOnly = true)
    public List<ReshelvingItemResponse> getWaiting() {
        return getWaiting(null);
    }

    @Transactional(readOnly = true)
    public List<ReshelvingItemResponse> getWaiting(String branch) {
        validateBranch(branch, false);
        return jdbc.query("""
            SELECT q.id, i.barcode, p.title, i.location, i.branch,
                   q.queued_at, u.student_id, u.full_name, q.source
            FROM reshelving_tasks q
            JOIN items i ON i.id = q.item_id
            JOIN publications p ON p.id = i.publication_id
            LEFT JOIN users u ON u.id = q.user_id
            WHERE q.status = 'WAITING' AND i.status = 'AVAILABLE'
              AND (:branch IS NULL OR i.branch = :branch)
            ORDER BY i.branch ASC, i.location ASC NULLS LAST, q.queued_at DESC, q.id ASC
            """, new MapSqlParameterSource().addValue("branch", branch, java.sql.Types.VARCHAR), (rs, row) -> new ReshelvingItemResponse(
                rs.getString("id"), rs.getString("barcode"), rs.getString("title"),
                rs.getString("location"), rs.getString("branch"), rs.getTimestamp("queued_at").toInstant(),
                rs.getString("student_id"), rs.getString("full_name"), rs.getString("source")));
    }

    @Transactional(readOnly = true)
    public long countWaiting() {
        return countWaiting(null);
    }

    @Transactional(readOnly = true)
    public long countWaiting(String branch) {
        validateBranch(branch, false);
        Long count = jdbc.queryForObject("""
            SELECT COUNT(*) FROM reshelving_tasks q JOIN items i ON i.id = q.item_id
            WHERE q.status = 'WAITING' AND i.status = 'AVAILABLE'
              AND (:branch IS NULL OR i.branch = :branch)
            """, new MapSqlParameterSource().addValue("branch", branch, java.sql.Types.VARCHAR), Long.class);
        return count == null ? 0 : count;
    }

    /** Called after the return has been flushed and reservation assignment has run. */
    @Transactional
    public void recordReturn(Long transactionId, boolean assignedToReservation) {
        jdbc.update("""
            UPDATE borrowing_transactions t
            SET reshelving_status = CASE WHEN :required AND i.status = 'AVAILABLE'
                THEN 'WAITING' ELSE 'NOT_REQUIRED' END, updated_at = NOW()
            FROM items i WHERE t.id = :id AND i.id = t.item_id AND t.status = 'RETURNED'
                AND t.reshelving_status <> 'SHELVED'
            """, Map.of("id", transactionId, "required", !assignedToReservation));
        if (!assignedToReservation) {
            jdbc.update("""
                INSERT INTO reshelving_tasks(id, item_id, transaction_id, user_id, source, queued_at)
                SELECT :taskId, t.item_id, t.id, t.user_id, 'RETURN', t.returned_date
                FROM borrowing_transactions t JOIN items i ON i.id = t.item_id
                WHERE t.id = :id AND t.status = 'RETURNED' AND i.status = 'AVAILABLE'
                ON CONFLICT DO NOTHING
                """, Map.of("taskId", TsIdGenerator.next(), "id", transactionId));
        }
    }

    /** Caller locks the copy and offers it to the next reservation before queuing. */
    @Transactional
    public void recordAvailable(Long itemId, Long transactionId, Long reservationId, Long userId, Source source) {
        if (source == null || source == Source.RETURN
            || (source == Source.PICKUP_EXPIRED || source == Source.LOST_RECOVERED
                ? transactionId == null || reservationId != null : reservationId == null || transactionId != null)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        jdbc.update("""
            INSERT INTO reshelving_tasks(id, item_id, transaction_id, reservation_id, user_id, source)
            SELECT :id, i.id, :transactionId, :reservationId, :userId, :source FROM items i
            WHERE i.id = :itemId AND i.status = 'AVAILABLE'
            ON CONFLICT DO NOTHING
            """, new MapSqlParameterSource("id", TsIdGenerator.next())
                .addValue("itemId", itemId).addValue("transactionId", transactionId)
                .addValue("reservationId", reservationId).addValue("userId", userId).addValue("source", source.name()));
    }

    @Transactional
    public Map<String, Integer> confirm(List<Long> taskIds, Long librarianId, String branch) {
        validateBranch(branch, true);
        if (taskIds == null || taskIds.isEmpty() || taskIds.size() > 10000
            || taskIds.stream().anyMatch(id -> id == null || id <= 0)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        var ids = taskIds.stream().distinct().sorted().toList();
        var params = Map.<String, Object>of("ids", ids, "librarianId", librarianId, "branch", branch);
        // Same lock order as borrowing/returning: lock copies FIRST. A concurrent
        // checkout or reservation cannot be mistaken for a successful shelving.
        jdbc.queryForList("""
            SELECT id FROM items WHERE id IN (
                SELECT item_id FROM reshelving_tasks WHERE id IN (:ids)
            ) AND branch = :branch ORDER BY id FOR UPDATE
            """, params);
        List<Long> updated = jdbc.queryForList("""
            UPDATE reshelving_tasks q
            SET status = 'SHELVED', shelved_at = NOW(),
                shelved_by_librarian_id = :librarianId, updated_at = NOW()
            FROM items i
            WHERE q.id IN (:ids) AND i.id = q.item_id AND i.status = 'AVAILABLE' AND q.status = 'WAITING'
              AND i.branch = :branch
            RETURNING q.id
            """, params, Long.class);
        if (!updated.isEmpty()) {
            // Synchronize return report fields, without pretending a released hold was a return.
            jdbc.update("""
                UPDATE borrowing_transactions t SET reshelving_status = 'SHELVED',
                    shelved_at = q.shelved_at, shelved_by_librarian_id = q.shelved_by_librarian_id, updated_at = NOW()
                FROM reshelving_tasks q WHERE q.id IN (:ids) AND q.transaction_id = t.id AND q.source = 'RETURN'
                """, Map.of("ids", updated));
            audit.log(librarianId, RoleConstants.LIBRARIAN, "CONFIRM_RESHELVING", "reshelving_tasks", null,
                "Librarian confirmed books shelved", Map.of("taskIds", updated, "count", updated.size(), "branch", branch));
        }
        return Map.of("updatedCount", updated.size(), "skippedCount", ids.size() - updated.size());
    }

    private void validateBranch(String branch, boolean required) {
        if (branch == null && !required) return;
        if (!"Cơ sở 1 - Lý Thường Kiệt".equals(branch) && !"Cơ sở 2 - Dĩ An".equals(branch))
            throw new AppException(ErrorCode.INVALID_INPUT);
    }

    @Transactional(readOnly = true)
    public String getDefaultBranch(Long librarianId) {
        var campuses = jdbc.queryForList("SELECT librarian_campus FROM users WHERE id = :id",
            Map.of("id", librarianId), String.class);
        if (campuses.isEmpty()) return "ALL";
        return switch (String.valueOf(campuses.get(0))) {
            case "CAMPUS_1" -> "Cơ sở 1 - Lý Thường Kiệt";
            case "CAMPUS_2" -> "Cơ sở 2 - Dĩ An";
            default -> "ALL";
        };
    }
}
