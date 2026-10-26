package com.library.recommendation.infrastructure.ai;

import static org.assertj.core.api.Assertions.*;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class FaqModelCooldownTest {
    static class MutableClock extends Clock {
        private Instant now;
        MutableClock(String now) { this.now = Instant.parse(now); }
        void advance(Duration duration) { now = now.plus(duration); }
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return Clock.fixed(now, zone); }
        @Override public Instant instant() { return now; }
    }

    @Test void successfulRequestsNeverConsumeALocalQuota() {
        var clock = new MutableClock("2026-10-26T00:00:59Z");
        var cooldown = new FaqModelCooldown(clock);
        for (int index = 0; index < 1000; index++) assertThat(cooldown.isAvailable()).isTrue();
    }

    @Test void computesPacificResetOnlyForAnActualProviderQuotaFailure() {
        var clock = new MutableClock("2026-10-26T06:59:50Z");
        var cooldown = new FaqModelCooldown(clock);
        assertThat(cooldown.nextDailyReset()).isEqualTo(Instant.parse("2026-10-26T07:00:00Z"));
        assertThat(cooldown.isAvailable()).isTrue();
        cooldown.pauseUntil(cooldown.nextDailyReset());
        assertThat(cooldown.isAvailable()).isFalse();
        clock.advance(Duration.ofSeconds(10)); assertThat(cooldown.isAvailable()).isTrue();
    }

    @Test void anotherFailureCannotShortenTheProviderCooldown() {
        var clock = new MutableClock("2026-10-26T08:00:00Z");
        var cooldown = new FaqModelCooldown(clock);
        cooldown.pauseUntil(clock.instant().plusSeconds(120));
        cooldown.pauseUntil(clock.instant().plusSeconds(15));
        clock.advance(Duration.ofSeconds(60)); assertThat(cooldown.isAvailable()).isFalse();
        clock.advance(Duration.ofSeconds(60)); assertThat(cooldown.isAvailable()).isTrue();
    }
}
