package com.library.recommendation.infrastructure.ai;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

/** Remembers provider failures, not request quotas. Successful calls never consume a local budget. */
final class FaqModelCooldown {
    private static final ZoneId QUOTA_ZONE = ZoneId.of("America/Los_Angeles");
    private final Clock clock;
    private Instant blockedUntil = Instant.MIN;

    FaqModelCooldown(Clock clock) {
        this.clock = clock;
    }

    synchronized boolean isAvailable() {
        return !clock.instant().isBefore(blockedUntil);
    }

    synchronized void pauseUntil(Instant until) {
        if (until.isAfter(blockedUntil)) blockedUntil = until;
    }

    Instant nextDailyReset() {
        return clock.instant().atZone(QUOTA_ZONE).toLocalDate().plusDays(1)
            .atStartOfDay(QUOTA_ZONE).toInstant();
    }
}
