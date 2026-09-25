package com.library.circulation.application.fine.impl;

import com.library.circulation.application.credit.ReaderCreditScoreService;
import com.library.circulation.application.fine.PayFineUseCase;
import com.library.circulation.domain.enums.PaymentStatus;
import com.library.circulation.dto.response.FineResponse;
import com.library.circulation.infrastructure.persistence.entity.FineEntity;
import com.library.circulation.infrastructure.persistence.repository.FineJpaRepository;
import com.library.shared.constant.RoleConstants;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.LibraryEmailMessage;
import com.library.shared.kafka.event.NotificationMessage;
import com.library.shared.service.LibrarianNotificationService;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayFineUseCaseImpl implements PayFineUseCase {

    private static final String FIND_FINE_WITH_PUBLICATION_SQL = """
        SELECT f.id, f.transaction_id, f.fine_amount, f.type,
               f.payment_status, f.created_at, f.paid_date,
               p.title AS publication_title
        FROM fines f
        JOIN borrowing_transactions t ON t.id = f.transaction_id
        JOIN items i        ON i.id = t.item_id
        JOIN publications p ON p.id = i.publication_id
        WHERE f.id = :fineId
        """;

    private final FineJpaRepository fineJpaRepository;
    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final com.library.shared.service.AuditLogService auditLogService;
    private final LibrarianNotificationService librarianNotificationService;
    private final ReaderCreditScoreService readerCreditScoreService;

    @Override
    @Transactional
    public FineResponse execute(Long fineId, Long librarianId) {
        FineEntity fine = fineJpaRepository.findById(fineId)
            .orElseThrow(() -> new AppException(ErrorCode.FINE_NOT_FOUND));

        if (fine.getPaymentStatus() == PaymentStatus.PAID) {
            throw new AppException(ErrorCode.FINE_ALREADY_PAID);
        }

        fine.setPaymentStatus(PaymentStatus.PAID);
        fine.setPaidDate(Instant.now());
        fine.setPaidByLibrarianId(librarianId);
        fineJpaRepository.save(fine);

        log.info("Fine paid: fineId={}", fineId);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            FIND_FINE_WITH_PUBLICATION_SQL, Map.of("fineId", fineId));

        Map<String, Object> row = rows.get(0);
        String publicationTitle = (String) row.get("publication_title");
        BigDecimal fineAmount   = (BigDecimal) row.get("fine_amount");
        Long userId             = ((Number) jdbcTemplate.queryForObject(
            "SELECT t.user_id FROM borrowing_transactions t WHERE t.id = :txId",
            Map.of("txId", ((Number) row.get("transaction_id")).longValue()), Long.class)).longValue();
        readerCreditScoreService.recordFinePayment(userId, 1);
        Map<String, Object> student = jdbcTemplate.queryForMap(
            "SELECT full_name, student_id FROM users WHERE id = :userId",
            Map.of("userId", userId)
        );

        // In-app notification
        kafkaTemplate.send(KafkaTopics.NOTIFICATION_SEND, new NotificationMessage(
            userId, "FINE_PAID",
            "Phí phạt đã được thanh toán",
            String.format("Phí phạt cho sách '%s' (%s) đã được ghi nhận thanh toán.", publicationTitle,
                new java.text.DecimalFormat("#,###").format(fineAmount) + "đ"),
            "/userpage/fines", fineId
        ));

        // Email
        kafkaTemplate.send(KafkaTopics.LIBRARY_EMAIL, new LibraryEmailMessage(
            userId, LibraryEmailMessage.FINE_PAID,
            Map.of("publicationTitle", publicationTitle,
                   "fineAmount", new java.text.DecimalFormat("#,###").format(fineAmount) + "đ",
                   "actionPath", "/userpage/fines")
        ));

        auditLogService.log(
            librarianId,
            RoleConstants.LIBRARIAN,
            "PAY_FINE",
            "fines",
            fineId,
            "Librarian marked one fine as paid",
            Map.of("fineId", fineId, "transactionId", row.get("transaction_id"), "amount", fineAmount)
        );
        librarianNotificationService.notifyAll(
            "LIB_FINE_PAID",
            "Đã thu phí phạt",
            String.format("%s (%s) đã thanh toán phí phạt %sđ cho '%s'. Phương thức: tiền mặt/thủ thư ghi nhận.",
                student.get("full_name"), student.get("student_id"),
                new java.text.DecimalFormat("#,###").format(fineAmount), publicationTitle),
            "/librarianpage/transactions?highlight=" + row.get("transaction_id"),
            fineId
        );

        return FineResponse.builder()
            .fineId(((Number) row.get("id")).longValue())
            .transactionId(((Number) row.get("transaction_id")).longValue())
            .publicationTitle(publicationTitle)
            .fineAmount(fineAmount)
            .type(com.library.user.domain.enums.ViolationType.valueOf((String) row.get("type")))
            .status(PaymentStatus.PAID)
            .createdAt(row.get("created_at") != null ? ((Timestamp) row.get("created_at")).toInstant() : null)
            .paidDate(fine.getPaidDate())
            .build();
    }
}
