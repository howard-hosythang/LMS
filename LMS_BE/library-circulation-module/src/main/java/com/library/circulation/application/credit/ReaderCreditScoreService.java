package com.library.circulation.application.credit;

import com.library.user.domain.enums.ViolationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReaderCreditScoreService {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public void recordReturn(Long userId, long daysLate) {
        int delta = daysLate > 0
            ? -Math.min(30, Math.toIntExact(Math.min(daysLate * 5, 30)))
            : 2;
        apply(userId, delta, daysLate > 0 ? "OVERDUE_RETURN" : "ON_TIME_RETURN");
    }

    public void recordBookIssue(Long userId, ViolationType type) {
        int delta = switch (type) {
            case DAMAGED_BOOK -> -20;
            case LOST_BOOK -> -35;
            case OVERDUE_RETURN -> -10;
        };
        apply(userId, delta, type.name());
    }

    public void recordFinePayment(Long userId, long paidFineCount) {
        if (paidFineCount <= 0) return;
        int delta = Math.min(10, Math.toIntExact(Math.min(paidFineCount * 2, 10)));
        apply(userId, delta, "FINE_PAID");
    }

    private void apply(Long userId, int delta, String reason) {
        if (userId == null || delta == 0) return;
        int updated = jdbcTemplate.update("""
            UPDATE users
            SET credit_score = LEAST(100, GREATEST(0, COALESCE(credit_score, 100) + :delta))
            WHERE id = :userId
            """, java.util.Map.of("userId", userId, "delta", delta));
        if (updated > 0) {
            log.info("Reader credit score adjusted: userId={}, delta={}, reason={}", userId, delta, reason);
        }
    }
}
