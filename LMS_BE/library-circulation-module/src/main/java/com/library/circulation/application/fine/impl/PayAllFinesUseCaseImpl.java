package com.library.circulation.application.fine.impl;

import com.library.circulation.application.credit.ReaderCreditScoreService;
import com.library.circulation.application.fine.PayAllFinesUseCase;
import com.library.shared.constant.RoleConstants;
import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.NotificationMessage;
import com.library.shared.service.LibrarianNotificationService;
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
public class PayAllFinesUseCaseImpl implements PayAllFinesUseCase {

    private static final String GET_USER_AND_COUNT_SQL = """
        SELECT t.user_id, COUNT(f.id) AS fine_count
        FROM fines f
        JOIN borrowing_transactions t ON t.id = f.transaction_id
        JOIN users u ON u.id = t.user_id
        WHERE u.student_id = :studentId
          AND f.payment_status = 'UNPAID'
        GROUP BY t.user_id
        """;

    private static final String PAY_ALL_SQL = """
        UPDATE fines
        SET payment_status = 'PAID',
            paid_date      = NOW(),
            paid_by_librarian_id = :librarianId
        WHERE payment_status = 'UNPAID'
          AND transaction_id IN (
              SELECT t.id FROM borrowing_transactions t
              JOIN users u ON u.id = t.user_id
              WHERE u.student_id = :studentId
          )
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final com.library.shared.service.AuditLogService auditLogService;
    private final LibrarianNotificationService librarianNotificationService;
    private final ReaderCreditScoreService readerCreditScoreService;

    @Override
    @Transactional
    public int execute(String studentId, Long librarianId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            GET_USER_AND_COUNT_SQL, Map.of("studentId", studentId.trim()));

        if (rows.isEmpty()) return 0;

        Long userId    = ((Number) rows.get(0).get("user_id")).longValue();
        long fineCount = ((Number) rows.get(0).get("fine_count")).longValue();

        int updated = jdbcTemplate.update(PAY_ALL_SQL, Map.of(
            "studentId", studentId.trim(),
            "librarianId", librarianId
        ));
        readerCreditScoreService.recordFinePayment(userId, updated);
        log.info("Paid all fines for studentId={}, count={}", studentId, updated);

        kafkaTemplate.send(KafkaTopics.NOTIFICATION_SEND, new NotificationMessage(
            userId, "FINE_PAID",
            "Phí phạt đã được thanh toán",
            String.format("Bạn đã hoàn tất thanh toán %d khoản phí phạt.", fineCount),
            "/userpage/fines", null
        ));

        auditLogService.log(
            librarianId,
            RoleConstants.LIBRARIAN,
            "PAY_ALL_FINES",
            "fines",
            studentId.trim(),
            "Librarian marked all unpaid fines as paid",
            Map.of("studentId", studentId.trim(), "paidCount", updated)
        );
        librarianNotificationService.notifyAll(
            "LIB_FINE_PAID",
            "Đã thu tất cả phí phạt",
            String.format("Sinh viên %s đã thanh toán %d khoản phí phạt. Phương thức: tiền mặt/thủ thư ghi nhận.",
                studentId.trim(), updated),
            "/librarianpage/transactions",
            null
        );

        return updated;
    }
}
