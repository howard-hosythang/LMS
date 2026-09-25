package com.library.circulation.dto.response;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardSummaryResponse {

    private Overview overview;
    private TodayTransaction todayTransaction;
    private PendingActions pendingActions;
    private FineSummary fineSummary;

    @Data
    @Builder
    public static class Overview {
        private long totalUsers;
        private long activeUsers;
        private long totalPublications;
        private long totalItems;
        private long availableItems;
    }

    @Data
    @Builder
    public static class TodayTransaction {
        private long borrowedToday;
        private long returnedToday;
        private long damagedToday;
        private long lostToday;
        private long newlyOverdueToday;
    }

    @Data
    @Builder
    public static class PendingActions {
        private long waitingForPickup;
        private long overdueTransactions;
        private long reservationsPending;
    }

    @Data
    @Builder
    public static class FineSummary {
        private long unpaidFineCount;
        private BigDecimal totalUnpaidAmount;
        private BigDecimal collectedToday;
    }
}
