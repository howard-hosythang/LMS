package com.library.circulation.application.deposit;

import static com.library.circulation.application.deposit.DepositPaymentOrderStore.*;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.circulation.dto.request.DepositPaymentRequest;
import com.library.circulation.dto.response.DepositPaymentResponse;
import com.library.circulation.infrastructure.payment.PayOsClient;
import com.library.shared.constant.RoleConstants;
import com.library.shared.service.AuditLogService;
import java.math.BigDecimal;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class DepositPaymentService {
    private final DepositPaymentOrderStore store;
    private final NamedParameterJdbcTemplate jdbc;
    private final PayOsClient payOsClient;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    @Value("${base.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    // Intentionally not transactional. prepare commits the order before the external request.
    public DepositPaymentResponse create(DepositPaymentRequest request, Long librarianId) {
        try { payOsClient.ensureConfigured(); }
        catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Chưa cấu hình kết nối payOS để thu cọc. Vui lòng liên hệ quản trị viên.", e);
        }
        var order = store.prepare(request, librarianId);
        Long code = number(order, "order_code");
        if (!"CREATING".equals(order.get("status"))) return response(order);
        PayOsClient.PayOsPaymentLink link;
        boolean recovered = false;
        try {
            link = payOsClient.createPaymentLink(code, ((BigDecimal) order.get("amount")).intValueExact(),
                (String) order.get("description"), (String) order.get("full_name"), "Library borrowing deposit",
                frontendUrl + "/#/librarianpage/circulation?deposit=cancelled",
                frontendUrl + "/#/librarianpage/circulation?deposit=success");
        } catch (RuntimeException createError) {
            // A timeout may have occurred AFTER payOS created the link. Recover the same code, never a new one.
            try {
                var details = payOsClient.getPaymentDetails(code);
                validateProvider(order, details);
                if (details.paymentLinkId() == null || !details.paymentLinkId().matches("[a-zA-Z0-9_-]+")) throw createError;
                // GET may return id/status only, not the original VietQR payload. Open the same hosted checkout to recover its QR.
                String checkout = details.checkoutUrl() != null ? details.checkoutUrl() : "https://pay.payos.vn/web/" + details.paymentLinkId();
                link = new PayOsClient.PayOsPaymentLink(details.paymentLinkId(), checkout, details.qrCode());
                recovered = true;
            } catch (RuntimeException lookupError) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Chưa tạo được QR cọc. Hãy thử lại cùng bạn đọc và sách; hệ thống giữ nguyên mã đơn để tránh thu trùng.", createError);
            }
        }
        if (link.paymentLinkId() == null || link.checkoutUrl() == null || (!recovered && (link.qrCode() == null || link.qrCode().isBlank()))) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "payOS chưa trả về mã QR hợp lệ. Vui lòng thử lại cùng đơn cọc.");
        }
        jdbc.update("""
            UPDATE deposit_payment_orders SET payment_link_id=:linkId,checkout_url=:url,qr_code=:qr,
                status=CASE WHEN status='CREATING' THEN 'PENDING' ELSE status END,updated_at=NOW()
            WHERE order_code=:code
            """, new MapSqlParameterSource().addValue("code", code).addValue("linkId", link.paymentLinkId())
                .addValue("url", link.checkoutUrl()).addValue("qr", link.qrCode()));
        return response(store.find(code, false));
    }

    @Transactional
    public DepositPaymentResponse sync(Long code, Long librarianId) {
        var order = store.find(code, true);
        if ("CONSUMED".equals(order.get("status")) || "PAID".equals(order.get("status"))) return response(order);
        var remote = payOsClient.getPaymentDetails(code);
        validateProvider(order, remote);
        if ("PAID".equals(remote.status())) {
            if (remote.amountPaid() == null || BigDecimal.valueOf(remote.amountPaid()).compareTo((BigDecimal) order.get("amount")) != 0) {
                throw conflict("Số tiền cọc thực nhận chưa khớp đơn payOS. Không thể giao sách; cần đồng bộ hoặc đối soát.");
            }
            markPaid(code, librarianId);
        } else if ("CANCELLED".equals(remote.status()) || "EXPIRED".equals(remote.status())) {
            // Partial transfers cannot silently be discarded and replaced by another payment.
            if (remote.amountPaid() == null || remote.amountPaid() > 0) throw conflict("Chưa xác nhận đơn không nhận tiền cọc; cần đồng bộ hoặc đối soát trước khi tạo đơn khác.");
            jdbc.update("UPDATE deposit_payment_orders SET status=:status,updated_at=NOW() WHERE order_code=:code AND status IN ('CREATING','PENDING')",
                Map.of("status", remote.status(), "code", code));
        }
        return response(store.find(code, false));
    }

    @Transactional
    public DepositPaymentResponse cancel(Long code, Long librarianId) {
        var order = store.find(code, true);
        if ("CANCELLED".equals(order.get("status")) || "EXPIRED".equals(order.get("status"))) return response(order);
        if ("PAID".equals(order.get("status")) || "CONSUMED".equals(order.get("status"))) throw conflict("Cọc đã thanh toán; không thể hủy hoặc chuyển sang thu tiền mặt.");
        var remote = payOsClient.getPaymentDetails(code);
        validateProvider(order, remote);
        if ("PAID".equals(remote.status()) || remote.amountPaid() == null || remote.amountPaid() > 0) {
            throw conflict("Đơn đã nhận tiền. Hãy đồng bộ lại để tiếp tục giao sách hoặc đối soát.");
        }
        if (!"CANCELLED".equals(remote.status()) && !"EXPIRED".equals(remote.status())) payOsClient.cancelPayment(code);
        // Re-read after cancellation to guard against a payment racing the cancellation.
        var result = payOsClient.getPaymentDetails(code);
        validateProvider(order, result);
        if (!"CANCELLED".equals(result.status()) && !"EXPIRED".equals(result.status())) throw conflict("Chưa xác nhận hủy từ payOS. Hãy đồng bộ lại.");
        if (result.amountPaid() == null || result.amountPaid() > 0) throw conflict("Chưa xác nhận đơn không nhận tiền; cần đối soát.");
        jdbc.update("UPDATE deposit_payment_orders SET status=:status,updated_at=NOW() WHERE order_code=:code",
            Map.of("status", result.status(), "code", code));
        return response(store.find(code, false));
    }

    // Called inside the handover transaction. Consuming the order, collecting deposit and handing over commit together.
    @Transactional
    public BigDecimal resolveForHandover(String method, Long code, String flow, Long sourceId, Long transactionId,
        Long userId, Long itemId, BigDecimal policyAmount, Long librarianId) {
        method = BorrowDepositService.normalizePaymentMethod(method);
        if ("CASH".equals(method)) {
            if (code != null) throw conflict("Không thể sử dụng đơn payOS cho khoản cọc tiền mặt.");
            requireNoOpenOrder(userId, itemId);
            return policyAmount;
        }
        if (policyAmount != null && policyAmount.signum() <= 0 && code == null) {
            requireNoOpenOrder(userId, itemId);
            return policyAmount;
        }
        if (code == null) throw conflict("Chưa có đơn cọc payOS đã thanh toán. Không thể giao sách bằng chuyển khoản.");
        var order = store.find(code, true);
        if (!"PAID".equals(order.get("status")) || number(order, "consumed_transaction_id") != null) throw conflict("Đơn cọc chưa thanh toán hoặc đã được sử dụng.");
        if (!Objects.equals(userId, number(order, "user_id")) || !Objects.equals(itemId, number(order, "item_id"))
            || !flow.equals(order.get("flow")) || !Objects.equals(sourceId, number(order, "source_id"))) {
            throw conflict("Đơn cọc không khớp bạn đọc, bản sao hoặc phiếu giao sách.");
        }
        int updated = jdbc.update("""
            UPDATE deposit_payment_orders SET status='CONSUMED',consumed_transaction_id=:transactionId,
                consumed_at=NOW(),updated_at=NOW() WHERE order_code=:code AND status='PAID'
            """, Map.of("transactionId", transactionId, "code", code));
        if (updated != 1) throw conflict("Đơn cọc đã được sử dụng.");
        auditLogService.log(librarianId, RoleConstants.LIBRARIAN, "CONSUME_DEPOSIT_PAYMENT", "deposit_payment_orders", code,
            "Paid payOS deposit attached to handover", Map.of("orderCode", code, "transactionId", transactionId));
        // Honor the paid quote if policy changed between QR creation and handover; do not charge twice.
        return (BigDecimal) order.get("amount");
    }

    private void requireNoOpenOrder(Long userId, Long itemId) {
        var open = jdbc.queryForList("SELECT order_code FROM deposit_payment_orders WHERE user_id=:userId AND item_id=:itemId AND status IN ('CREATING','PENDING','PAID') FOR UPDATE",
            Map.of("userId", userId, "itemId", itemId));
        if (!open.isEmpty()) throw conflict("Đã có đơn cọc payOS. Hãy tiếp tục thanh toán hoặc hủy đơn chưa nhận tiền trước khi thu tiền mặt.");
    }

    @Transactional
    public void webhook(String rawBody) {
        Map<String, Object> payload;
        try { payload = objectMapper.readValue(rawBody, new TypeReference<Map<String, Object>>() {}); }
        catch (Exception e) { throw new IllegalArgumentException("Invalid payOS payload", e); }
        if (!payOsClient.verifyWebhook(payload)) throw new IllegalArgumentException("Invalid payOS signature");
        if (!Boolean.TRUE.equals(payload.get("success")) || !(payload.get("data") instanceof Map<?, ?> data)
            || !"00".equals(data.get("code")) || !(data.get("orderCode") instanceof Number codeValue)) return;
        Long code = codeValue.longValue();
        var orders = jdbc.queryForList("SELECT * FROM deposit_payment_orders WHERE order_code=:code FOR UPDATE", Map.of("code", code));
        if (orders.isEmpty()) return; // Existing fine webhook is also used by this payment channel.
        var order = orders.getFirst();
        if ("PAID".equals(order.get("status")) || "CONSUMED".equals(order.get("status"))) return;
        BigDecimal received;
        try { received = new BigDecimal(String.valueOf(data.get("amount"))); } catch (NumberFormatException e) { throw new IllegalArgumentException("Invalid payOS amount", e); }
        if (received.compareTo((BigDecimal) order.get("amount")) == 0) markPaid(code, null);
        // Partial payments are resolved by sync using the provider's aggregate amountPaid.
    }

    private void validateProvider(Map<String, Object> order, PayOsClient.PayOsPaymentDetails remote) {
        if (!Objects.equals(number(order, "order_code"), remote.orderCode()) || remote.amount() == null
            || BigDecimal.valueOf(remote.amount()).compareTo((BigDecimal) order.get("amount")) != 0
            || (order.get("payment_link_id") != null && !Objects.equals(order.get("payment_link_id"), remote.paymentLinkId()))) {
            throw conflict("Thông tin hoặc số tiền đơn cọc từ payOS không khớp. Cần đối soát.");
        }
    }

    private void markPaid(Long code, Long librarianId) {
        jdbc.update("UPDATE deposit_payment_orders SET status='PAID',paid_at=NOW(),synced_by_librarian_id=:librarianId,updated_at=NOW() WHERE order_code=:code AND status<>'CONSUMED'",
            new MapSqlParameterSource().addValue("code", code).addValue("librarianId", librarianId));
        auditLogService.log(librarianId, librarianId == null ? "PAYOS" : RoleConstants.LIBRARIAN, "PAY_DEPOSIT_ORDER",
            "deposit_payment_orders", code, "payOS confirmed deposit payment", Map.of("orderCode", code, "provider", "PAYOS"));
    }
}
