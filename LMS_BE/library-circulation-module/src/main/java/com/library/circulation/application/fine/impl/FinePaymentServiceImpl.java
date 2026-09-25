package com.library.circulation.application.fine.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.circulation.application.fine.FinePaymentService;
import com.library.circulation.dto.response.FinePaymentLinkResponse;
import com.library.circulation.infrastructure.payment.PayOsClient;
import com.library.shared.constant.RoleConstants;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.NotificationMessage;
import com.library.shared.service.LibrarianNotificationService;
import com.library.shared.util.TsIdGenerator;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FinePaymentServiceImpl implements FinePaymentService {

    private static final String FIND_STUDENT_FINES_SQL = """
        SELECT u.id AS user_id, u.student_id, u.full_name,
               f.id AS fine_id, f.fine_amount
        FROM fines f
        JOIN borrowing_transactions t ON t.id = f.transaction_id
        JOIN users u ON u.id = t.user_id
        WHERE u.student_id = :studentId
          AND u.status = 'ACTIVE'
          AND f.payment_status = 'UNPAID'
        ORDER BY f.id ASC
        """;

    private static final String FIND_PENDING_ORDER_SQL = """
        SELECT order_code, payment_link_id, checkout_url, qr_code, description,
               amount, fine_count, student_id, :fullName AS full_name
        FROM fine_payment_orders
        WHERE student_id = :studentId
          AND status = 'PENDING'
          AND amount = :amount
          AND fine_ids = :fineIds
        ORDER BY created_at DESC
        LIMIT 1
        """;

    private static final String INSERT_ORDER_SQL = """
        INSERT INTO fine_payment_orders (
            id, created_at, updated_at, student_id, user_id, order_code,
            amount, fine_count, fine_ids, description, provider, status,
            payment_link_id, checkout_url, qr_code, created_by_librarian_id
        )
        VALUES (
            :id, NOW(), NOW(), :studentId, :userId, :orderCode,
            :amount, :fineCount, :fineIds, :description, 'PAYOS', 'PENDING',
            :paymentLinkId, :checkoutUrl, :qrCode, :librarianId
        )
        """;

    private static final String INSERT_ORDER_FINE_SQL = """
        INSERT INTO fine_payment_order_fines (order_id, fine_id)
        VALUES (:orderId, :fineId)
        ON CONFLICT DO NOTHING
        """;

    private static final String FIND_ORDER_BY_CODE_SQL = """
        SELECT id, student_id, user_id, order_code, amount, fine_count, fine_ids, status
        FROM fine_payment_orders
        WHERE order_code = :orderCode
        FOR UPDATE
        """;

    private static final String MARK_FINE_IDS_PAID_SQL = """
        UPDATE fines
        SET payment_status = 'PAID',
            paid_date = NOW(),
            paid_by_librarian_id = :librarianId
        WHERE payment_status = 'UNPAID'
          AND id IN (:fineIds)
        """;

    private static final String MARK_ORDER_PAID_SQL = """
        UPDATE fine_payment_orders
        SET status = 'PAID',
            paid_at = NOW(),
            reference = :reference,
            paid_by_librarian_id = :librarianId,
            updated_at = NOW()
        WHERE order_code = :orderCode
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final PayOsClient payOsClient;
    private final ObjectMapper objectMapper;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final com.library.shared.service.AuditLogService auditLogService;
    private final LibrarianNotificationService librarianNotificationService;

    @Value("${base.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    @Transactional
    public FinePaymentLinkResponse createPayOsPaymentLink(String studentId, Long librarianId) {
        String normalizedStudentId = studentId.trim();
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            FIND_STUDENT_FINES_SQL,
            Map.of("studentId", normalizedStudentId)
        );
        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.FINE_NOT_FOUND);
        }

        Long userId = ((Number) rows.get(0).get("user_id")).longValue();
        String fullName = (String) rows.get(0).get("full_name");
        List<Long> fineIds = rows.stream()
            .map(row -> ((Number) row.get("fine_id")).longValue())
            .toList();
        BigDecimal amount = rows.stream()
            .map(row -> (BigDecimal) row.get("fine_amount"))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        String fineIdsText = fineIds.stream().map(String::valueOf).collect(Collectors.joining(","));

        List<Map<String, Object>> pendingOrders = jdbcTemplate.queryForList(
            FIND_PENDING_ORDER_SQL,
            new MapSqlParameterSource()
                .addValue("studentId", normalizedStudentId)
                .addValue("amount", amount)
                .addValue("fineIds", fineIdsText)
                .addValue("fullName", fullName)
        );
        if (!pendingOrders.isEmpty()) {
            return toPaymentLinkResponse(pendingOrders.get(0));
        }

        Long orderCode = generateOrderCode();
        String description = buildDescription(normalizedStudentId);
        int amountAsInt = amount.intValueExact();
        PayOsClient.PayOsPaymentLink paymentLink = payOsClient.createPaymentLink(
            orderCode,
            amountAsInt,
            description,
            fullName,
            rows.size(),
            frontendUrl + "/#/librarianpage/circulation?payment=cancelled",
            frontendUrl + "/#/librarianpage/circulation?payment=success"
        );

        Long orderId = TsIdGenerator.next();
        jdbcTemplate.update(
            INSERT_ORDER_SQL,
            new MapSqlParameterSource()
                .addValue("id", orderId)
                .addValue("studentId", normalizedStudentId)
                .addValue("userId", userId)
                .addValue("orderCode", orderCode)
                .addValue("amount", amount)
                .addValue("fineCount", rows.size())
                .addValue("fineIds", fineIdsText)
                .addValue("description", description)
                .addValue("paymentLinkId", paymentLink.paymentLinkId())
                .addValue("checkoutUrl", paymentLink.checkoutUrl())
                .addValue("qrCode", paymentLink.qrCode())
                .addValue("librarianId", librarianId)
        );
        fineIds.forEach(fineId -> jdbcTemplate.update(
            INSERT_ORDER_FINE_SQL,
            new MapSqlParameterSource()
                .addValue("orderId", orderId)
                .addValue("fineId", fineId)
        ));

        return FinePaymentLinkResponse.builder()
            .orderCode(orderCode)
            .paymentLinkId(paymentLink.paymentLinkId())
            .checkoutUrl(paymentLink.checkoutUrl())
            .qrCode(paymentLink.qrCode())
            .description(description)
            .amount(amount)
            .fineCount(rows.size())
            .studentId(normalizedStudentId)
            .fullName(fullName)
            .build();
    }

    @Override
    @Transactional
    public int confirmPayOsWebhook(String rawBody) {
        Map<String, Object> payload = parseJson(rawBody);
        if (!payOsClient.verifyWebhook(payload)) {
            throw new IllegalArgumentException("Invalid payOS webhook signature");
        }

        Object success = payload.get("success");
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) payload.get("data");
        if (!Boolean.TRUE.equals(success) || data == null || !"00".equals(String.valueOf(data.get("code")))) {
            return 0;
        }

        Long orderCode = ((Number) data.get("orderCode")).longValue();
        BigDecimal amount = new BigDecimal(String.valueOf(data.get("amount")));
        String reference = data.get("reference") != null ? String.valueOf(data.get("reference")) : null;

        return completePaidOrder(orderCode, amount, reference, null);
    }

    @Override
    @Transactional
    public int syncPayOsPayment(Long orderCode, Long librarianId) {
        PayOsClient.PayOsPaymentStatus paymentStatus = payOsClient.getPaymentStatus(orderCode);
        if (paymentStatus.status() == null || !"PAID".equalsIgnoreCase(paymentStatus.status())) {
            return 0;
        }

        BigDecimal amount = paymentStatus.amount() != null
            ? BigDecimal.valueOf(paymentStatus.amount())
            : null;
        return completePaidOrder(paymentStatus.orderCode(), amount, "PAYOS_SYNC", librarianId);
    }

    private int completePaidOrder(Long orderCode, BigDecimal amount, String reference, Long librarianId) {
        List<Map<String, Object>> orders = jdbcTemplate.queryForList(
            FIND_ORDER_BY_CODE_SQL,
            Map.of("orderCode", orderCode)
        );
        if (orders.isEmpty()) {
            log.warn("payOS webhook ignored because orderCode={} is unknown", orderCode);
            return 0;
        }

        Map<String, Object> order = orders.get(0);
        if ("PAID".equals(order.get("status"))) {
            return 0;
        }
        BigDecimal expectedAmount = (BigDecimal) order.get("amount");
        if (amount != null && expectedAmount.compareTo(amount) != 0) {
            log.warn("payOS webhook amount mismatch: orderCode={}, expected={}, actual={}",
                orderCode, expectedAmount, amount);
            return 0;
        }

        List<Long> fineIds = parseFineIds((String) order.get("fine_ids"));
        int updated = jdbcTemplate.update(
            MARK_FINE_IDS_PAID_SQL,
            new MapSqlParameterSource()
                .addValue("fineIds", fineIds)
                .addValue("librarianId", librarianId)
        );
        jdbcTemplate.update(
            MARK_ORDER_PAID_SQL,
            new MapSqlParameterSource()
                .addValue("orderCode", orderCode)
                .addValue("reference", reference)
                .addValue("librarianId", librarianId)
        );

        Long userId = ((Number) order.get("user_id")).longValue();
        kafkaTemplate.send(KafkaTopics.NOTIFICATION_SEND, new NotificationMessage(
            userId,
            "FINE_PAID",
            "Phí phạt đã được thanh toán",
            String.format(Locale.ROOT, "Bạn đã hoàn tất thanh toán %d khoản phí phạt qua chuyển khoản.", updated),
            "/userpage/fines",
            orderCode
        ));
        auditLogService.log(
            librarianId,
            librarianId == null ? "PAYOS" : RoleConstants.LIBRARIAN,
            "COMPLETE_FINE_PAYMENT_ORDER",
            "fine_payment_orders",
            orderCode,
            "Fine payment order completed",
            Map.of("orderCode", orderCode, "paidCount", updated, "provider", "PAYOS")
        );
        librarianNotificationService.notifyAll(
            "LIB_FINE_PAID",
            "Đã thu phí phạt qua PayOS",
            String.format(Locale.ROOT, "Sinh viên %s đã thanh toán %d khoản phí phạt, tổng %sđ. Phương thức: PayOS/chuyển khoản.",
                order.get("student_id"), updated, new java.text.DecimalFormat("#,###").format(expectedAmount)),
            "/librarianpage/transactions",
            orderCode
        );
        log.info("payOS fine payment completed: orderCode={}, paidFines={}", orderCode, updated);
        return updated;
    }

    private FinePaymentLinkResponse toPaymentLinkResponse(Map<String, Object> row) {
        return FinePaymentLinkResponse.builder()
            .orderCode(((Number) row.get("order_code")).longValue())
            .paymentLinkId((String) row.get("payment_link_id"))
            .checkoutUrl((String) row.get("checkout_url"))
            .qrCode((String) row.get("qr_code"))
            .description((String) row.get("description"))
            .amount((BigDecimal) row.get("amount"))
            .fineCount(((Number) row.get("fine_count")).intValue())
            .studentId((String) row.get("student_id"))
            .fullName((String) row.get("full_name"))
            .build();
    }

    private Long generateOrderCode() {
        long epochSeconds = Instant.now().getEpochSecond();
        return epochSeconds * 1000 + Math.floorMod(TsIdGenerator.next(), 1000);
    }

    private String buildDescription(String studentId) {
        String digits = studentId.replaceAll("\\D+", "");
        if (digits.length() > 7) {
            digits = digits.substring(digits.length() - 7);
        }
        return "LMS FINE " + digits;
    }

    private Map<String, Object> parseJson(String rawBody) {
        try {
            return objectMapper.readValue(rawBody, new TypeReference<TreeMap<String, Object>>() {});
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid payOS webhook payload", e);
        }
    }

    private List<Long> parseFineIds(String fineIdsText) {
        return List.of(fineIdsText.split(",")).stream()
            .filter(value -> !value.isBlank())
            .map(Long::valueOf)
            .toList();
    }
}
