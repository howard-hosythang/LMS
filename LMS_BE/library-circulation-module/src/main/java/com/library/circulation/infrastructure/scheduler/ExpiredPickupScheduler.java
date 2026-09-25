package com.library.circulation.infrastructure.scheduler;

import com.library.circulation.infrastructure.service.ReservationAssignmentService;
import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.NotificationMessage;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExpiredPickupScheduler {

    private static final String FIND_EXPIRED_SQL = """
        SELECT t.id AS transaction_id, t.user_id, t.item_id,
               p.title AS publication_title, i.publication_id, i.branch
        FROM borrowing_transactions t
        JOIN items i        ON i.id = t.item_id
        JOIN publications p ON p.id = i.publication_id
        WHERE t.status = 'WAITING_FOR_PICKUP'
          AND t.picked_up_deadline < NOW()
        """;

    private static final String CANCEL_TRANSACTIONS_SQL = """
        UPDATE borrowing_transactions
        SET status = 'CANCELLED', updated_at = NOW()
        WHERE id = :transactionId AND status = 'WAITING_FOR_PICKUP'
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final com.library.shared.port.ItemStatusPort itemStatusPort;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ReservationAssignmentService reservationAssignmentService;

    @Scheduled(fixedDelay = 3_600_000)
    @Transactional
    public void cancelExpiredPickups() {
        List<Map<String, Object>> expired = jdbcTemplate.queryForList(FIND_EXPIRED_SQL, Map.of());
        if (expired.isEmpty()) return;

        log.info("Cancelling {} expired pickup transaction(s)", expired.size());

        for (Map<String, Object> row : expired) {
            Long transactionId = ((Number) row.get("transaction_id")).longValue();
            Long userId        = ((Number) row.get("user_id")).longValue();
            Long itemId        = ((Number) row.get("item_id")).longValue();
            Long publicationId = ((Number) row.get("publication_id")).longValue();
            String title       = (String) row.get("publication_title");
            String branch      = (String) row.get("branch");

            // Cancel transaction
            jdbcTemplate.update(CANCEL_TRANSACTIONS_SQL,
                new MapSqlParameterSource("transactionId", transactionId));

            // Release item via port (catalog module's responsibility)
            itemStatusPort.updateStatus(itemId, "AVAILABLE");

            // Notify user
            kafkaTemplate.send(KafkaTopics.NOTIFICATION_SEND, new NotificationMessage(
                userId, "BORROW_CANCELLED_EXPIRED",
                "Yêu cầu mượn sách đã bị hủy",
                String.format("Yêu cầu mượn '%s' đã bị hủy do quá 24h không đến nhận.", title),
                "/userpage/my-books?highlight=" + transactionId, transactionId
            ));

            // Check if any reservation is waiting for this book
            reservationAssignmentService.tryAssign(itemId, publicationId,
                branch != null ? branch : "ANY");
        }

        log.info("Cancelled {} expired pickup transaction(s)", expired.size());
    }
}
