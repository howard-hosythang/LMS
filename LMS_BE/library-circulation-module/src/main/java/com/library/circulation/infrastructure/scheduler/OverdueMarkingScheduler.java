package com.library.circulation.infrastructure.scheduler;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class OverdueMarkingScheduler {

    private static final String MARK_OVERDUE_SQL = """
        UPDATE borrowing_transactions
        SET status = 'OVERDUE'
        WHERE status = 'BORROWING'
          AND due_date < CURRENT_DATE
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Scheduled(cron = "0 0 1 * * ?", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void markOverdueTransactions() {
        int updated = jdbcTemplate.update(MARK_OVERDUE_SQL, Map.of());
        if (updated > 0) {
            log.info("Marked {} transaction(s) as OVERDUE", updated);
        }
    }
}
