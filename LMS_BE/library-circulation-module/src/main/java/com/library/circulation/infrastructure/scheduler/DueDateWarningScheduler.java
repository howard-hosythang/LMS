package com.library.circulation.infrastructure.scheduler;

import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.LibraryEmailMessage;
import com.library.shared.kafka.event.NotificationMessage;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DueDateWarningScheduler {

    private static final String FIND_DUE_SOON_SQL = """
        SELECT t.id AS transaction_id, t.user_id,
               t.due_date,
               p.title AS publication_title
        FROM borrowing_transactions t
        JOIN items i        ON i.id = t.item_id
        JOIN publications p ON p.id = i.publication_id
        WHERE t.status  = 'BORROWING'
          AND t.due_date = CURRENT_DATE + :days
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Scheduled(cron = "0 0 8 * * ?", zone = "Asia/Ho_Chi_Minh")
    @Transactional(readOnly = true)
    public void warn3DaysBefore() {
        sendWarnings(3,
            "Sách sắp đến hạn trả",
            "Sách '%s' sẽ đến hạn trả vào ngày %s. Vui lòng trả đúng hạn.");
    }

    @Scheduled(cron = "0 0 8 * * ?", zone = "Asia/Ho_Chi_Minh")
    @Transactional(readOnly = true)
    public void warn1DayBefore() {
        sendWarnings(1,
            "Ngày mai là hạn trả sách!",
            "Sách '%s' sẽ đến hạn trả vào ngày mai (%s). Đừng quên trả sách đúng hạn!");
    }

    private void sendWarnings(int daysLeft, String notifTitle, String notifBodyTemplate) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            FIND_DUE_SOON_SQL, Map.of("days", daysLeft));

        if (rows.isEmpty()) return;

        log.info("Sending due date warnings ({} day(s) left) for {} transaction(s)", daysLeft, rows.size());

        for (Map<String, Object> row : rows) {
            Long userId       = ((Number) row.get("user_id")).longValue();
            String title      = (String) row.get("publication_title");
            String dueDate    = row.get("due_date").toString();
            Long transactionId = ((Number) row.get("transaction_id")).longValue();

            kafkaTemplate.send(KafkaTopics.NOTIFICATION_SEND, new NotificationMessage(
                userId, "OVERDUE_WARNING",
                notifTitle,
                String.format(notifBodyTemplate, title, dueDate),
                "/userpage/my-books?highlight=" + transactionId, transactionId
            ));

            kafkaTemplate.send(KafkaTopics.LIBRARY_EMAIL, new LibraryEmailMessage(
                userId,
                LibraryEmailMessage.DUE_DATE_WARNING,
                Map.of(
                    "publicationTitle", title,
                    "dueDate", dueDate,
                    "actionPath", "/userpage/my-books?highlight=" + transactionId
                )
            ));
        }

        log.info("Due date warnings ({} day(s) left) sent for {} transaction(s)", daysLeft, rows.size());
    }
}
