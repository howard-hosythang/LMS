package com.library.circulation.application.deposit;

import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.dto.request.DepositPaymentRequest;
import com.library.circulation.dto.response.DepositPaymentResponse;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.util.TsIdGenerator;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Component
@RequiredArgsConstructor
public class DepositPaymentOrderStore {
    private final NamedParameterJdbcTemplate jdbc;
    private final CirculationPolicyService policyService;
    private static final String ORDER_SQL = """
        SELECT o.*, u.student_id, u.full_name, i.barcode, p.title AS publication_title
        FROM deposit_payment_orders o JOIN users u ON u.id=o.user_id
        JOIN items i ON i.id=o.item_id JOIN publications p ON p.id=i.publication_id
        """;

    // Commits before calling payOS: a timeout/retry keeps the same durable order code.
    @Transactional
    public Map<String, Object> prepare(DepositPaymentRequest request, Long librarianId) {
        var target = target(request);
        Long userId = number(target, "user_id"), itemId = number(target, "item_id");
        var params = new MapSqlParameterSource().addValue("userId", userId).addValue("itemId", itemId);
        var existing = jdbc.queryForList(ORDER_SQL + " WHERE o.user_id=:userId AND o.item_id=:itemId AND o.status IN ('CREATING','PENDING','PAID') FOR UPDATE OF o", params);
        if (!existing.isEmpty()) {
            var order = existing.getFirst();
            if (!request.flow().equals(order.get("flow")) || !Objects.equals(request.sourceId(), number(order, "source_id"))) {
                throw conflict("Đã có đơn cọc đang xử lý cho bạn đọc và bản sao này. Hãy tiếp tục hoặc hủy đơn trước đó.");
            }
            return order;
        }
        var policy = policyService.getPolicy();
        var amount = policy.defaultDepositAmount();
        if (amount == null || amount.signum() <= 0) throw conflict("Chính sách hiện tại không yêu cầu thu cọc.");
        try { amount.intValueExact(); } catch (ArithmeticException e) { throw new AppException(ErrorCode.INVALID_REQUEST); }
        Long active = jdbc.queryForObject("SELECT COUNT(*) FROM borrowing_transactions WHERE user_id=:userId AND status IN ('WAITING_FOR_PICKUP','BORROWING')", params, Long.class);
        if ("DIRECT".equals(request.flow()) && active != null && active >= policy.maxActiveBorrows()) {
            throw new AppException(ErrorCode.USER_BORROW_LIMIT_EXCEEDED);
        }
        if (Boolean.TRUE.equals(policy.blockBorrowWhenUnpaidFines())) {
            Long debt = jdbc.queryForObject("SELECT COUNT(*) FROM fines f JOIN borrowing_transactions t ON t.id=f.transaction_id WHERE t.user_id=:userId AND f.payment_status='UNPAID'", params, Long.class);
            if (debt != null && debt > 0) throw new AppException(ErrorCode.USER_HAS_UNPAID_FINES);
        }
        Long code = jdbc.queryForObject("SELECT nextval('deposit_payment_order_code_seq')", Map.of(), Long.class);
        // Short bank-compatible description; order code and UI carry the full reader information.
        String description = "COC" + String.format(java.util.Locale.ROOT, "%06d", code % 1000000);
        params.addValue("id", TsIdGenerator.next()).addValue("code", code).addValue("flow", request.flow())
            .addValue("sourceId", request.sourceId()).addValue("amount", amount).addValue("description", description).addValue("librarianId", librarianId);
        jdbc.update("""
            INSERT INTO deposit_payment_orders(id,order_code,user_id,item_id,flow,source_id,amount,description,status,created_by_librarian_id)
            VALUES(:id,:code,:userId,:itemId,:flow,:sourceId,:amount,:description,'CREATING',:librarianId)
            """, params);
        return find(code, false);
    }

    private Map<String, Object> target(DepositPaymentRequest request) {
        String sql;
        var params = new MapSqlParameterSource();
        switch (request.flow()) {
            case "DIRECT" -> {
                if (request.sourceId() != null || request.studentId() == null || request.studentId().isBlank() || request.barcode() == null || request.barcode().isBlank()) throw new AppException(ErrorCode.INVALID_REQUEST);
                params.addValue("studentId", request.studentId().trim()).addValue("barcode", request.barcode().trim());
                sql = """
                    SELECT u.id AS user_id,i.id AS item_id FROM users u CROSS JOIN items i
                    WHERE u.student_id=:studentId AND u.status='ACTIVE' AND i.barcode=:barcode
                    AND (i.status='AVAILABLE' OR (i.status='RESERVED' AND EXISTS (
                        SELECT 1 FROM reservations r WHERE r.user_id=u.id AND r.assigned_item_id=i.id
                        AND r.status='READY_FOR_PICKUP' AND r.hold_expiration_time>=NOW())))
                    AND (i.status='RESERVED' OR NOT EXISTS (SELECT 1 FROM borrowing_transactions t JOIN items borrowed ON borrowed.id=t.item_id
                        WHERE t.user_id=u.id AND borrowed.publication_id=i.publication_id AND t.status IN ('WAITING_FOR_PICKUP','BORROWING')))
                    FOR UPDATE OF i,u
                    """;
            }
            case "TRANSACTION" -> {
                if (request.sourceId() == null) throw new AppException(ErrorCode.INVALID_REQUEST);
                params.addValue("sourceId", request.sourceId());
                sql = """
                    SELECT u.id AS user_id,i.id AS item_id FROM borrowing_transactions t
                    JOIN users u ON u.id=t.user_id JOIN items i ON i.id=t.item_id
                    WHERE t.id=:sourceId AND u.status='ACTIVE' AND t.status='WAITING_FOR_PICKUP'
                    AND (t.picked_up_deadline IS NULL OR t.picked_up_deadline>=NOW()) AND i.status='RESERVED'
                    FOR UPDATE OF i,u
                    """;
            }
            case "RESERVATION" -> {
                if (request.sourceId() == null) throw new AppException(ErrorCode.INVALID_REQUEST);
                params.addValue("sourceId", request.sourceId());
                sql = """
                    SELECT u.id AS user_id,i.id AS item_id FROM reservations r
                    JOIN users u ON u.id=r.user_id JOIN items i ON i.id=r.assigned_item_id
                    WHERE r.id=:sourceId AND u.status='ACTIVE' AND r.status='READY_FOR_PICKUP'
                    AND (r.hold_expiration_time IS NULL OR r.hold_expiration_time>=NOW()) AND i.status='RESERVED'
                    FOR UPDATE OF i,u
                    """;
            }
            default -> throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        List<Map<String, Object>> rows = jdbc.queryForList(sql, params);
        if (rows.isEmpty()) throw conflict("Bạn đọc hoặc sách không đủ điều kiện giao sách. Hãy tra cứu lại trước khi thu cọc.");
        return rows.getFirst();
    }

    public Map<String, Object> find(Long code, boolean lock) {
        var rows = jdbc.queryForList(ORDER_SQL + " WHERE o.order_code=:code" + (lock ? " FOR UPDATE OF o" : ""), Map.of("code", code));
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn cọc payOS.");
        return rows.getFirst();
    }

    public static Long number(Map<String, Object> row, String key) {
        return row.get(key) instanceof Number n ? n.longValue() : null;
    }

    public static ResponseStatusException conflict(String reason) { return new ResponseStatusException(HttpStatus.CONFLICT, reason); }

    public static DepositPaymentResponse response(Map<String, Object> row) {
        return new DepositPaymentResponse(number(row, "order_code"), (String) row.get("status"), (BigDecimal) row.get("amount"),
            (String) row.get("description"), (String) row.get("payment_link_id"), (String) row.get("checkout_url"),
            (String) row.get("qr_code"), (String) row.get("student_id"), (String) row.get("full_name"), (String) row.get("barcode"), (String) row.get("publication_title"));
    }
}
