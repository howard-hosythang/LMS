package com.library.circulation.infrastructure.scheduler;

import com.library.circulation.infrastructure.service.ReservationAssignmentService;
import com.library.circulation.application.reshelving.ReshelvingService;
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
public class ExpiredReservationScheduler {

    private static final String FIND_EXPIRED_SQL = """
        SELECT r.id AS reservation_id, r.user_id, r.assigned_item_id,
               r.publication_id, p.title AS publication_title, i.branch
        FROM reservations r
        JOIN publications p ON p.id = r.publication_id
        LEFT JOIN items i ON i.id = r.assigned_item_id
        WHERE r.status = 'READY_FOR_PICKUP'
          AND r.hold_expiration_time < NOW()
        ORDER BY r.assigned_item_id ASC NULLS LAST, r.id ASC
        """;

    private static final String EXPIRE_SQL = """
        UPDATE reservations
        SET status = 'EXPIRED', updated_at = NOW()
        WHERE id = :reservationId AND assigned_item_id IS NOT DISTINCT FROM :itemId
          AND status = 'READY_FOR_PICKUP' AND hold_expiration_time < NOW()
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final com.library.shared.port.ItemStatusPort itemStatusPort;
    private final ReservationAssignmentService assignmentService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ReshelvingService reshelvingService;

    @Scheduled(fixedDelay = 3_600_000)
    @Transactional
    public void expireReservations() {
        List<Map<String, Object>> expired = jdbcTemplate.queryForList(FIND_EXPIRED_SQL, Map.of());
        if (expired.isEmpty()) return;

        log.info("Expiring {} reservation(s)", expired.size());

        for (Map<String, Object> row : expired) {
            Long reservationId = ((Number) row.get("reservation_id")).longValue();
            Long itemId        = row.get("assigned_item_id") != null
                ? ((Number) row.get("assigned_item_id")).longValue() : null;
            Long publicationId = ((Number) row.get("publication_id")).longValue();
            Long userId        = ((Number) row.get("user_id")).longValue();
            String title       = (String) row.get("publication_title");
            String branch      = (String) row.get("branch");

            if (itemId != null) {
                var lockedItem = itemStatusPort.lockAndGet(itemId);
                if (!"RESERVED".equals(lockedItem.status())) continue;
            }
            int changed = jdbcTemplate.update(EXPIRE_SQL,
                new MapSqlParameterSource("reservationId", reservationId).addValue("itemId", itemId));
            if (changed == 0) continue;

            kafkaTemplate.send(KafkaTopics.NOTIFICATION_SEND, new NotificationMessage(
                userId, "RESERVATION_EXPIRED",
                "Đặt trước đã hết hạn",
                String.format("Lượt đặt trước '%s' đã hết hạn do quá thời gian nhận sách.", title),
                "/userpage/reservations?highlight=" + reservationId, reservationId
            ));

            if (itemId != null) {
                itemStatusPort.updateStatus(itemId, "AVAILABLE");
                boolean reassigned = assignmentService.tryAssign(itemId, publicationId, branch != null ? branch : "ANY");
                if (!reassigned) reshelvingService.recordAvailable(itemId, null, reservationId, userId,
                    ReshelvingService.Source.RESERVATION_EXPIRED);
            }
        }

        log.info("Expired {} reservation(s)", expired.size());
    }
}
