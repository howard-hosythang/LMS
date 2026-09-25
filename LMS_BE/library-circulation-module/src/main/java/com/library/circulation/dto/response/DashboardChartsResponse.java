package com.library.circulation.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DashboardChartsResponse {

    private List<TrendPoint> weeklyBorrowReturnTrend;
    private ItemStatusDistribution itemStatusDistribution;
    private List<TopBorrowedPublication> topBorrowedPublications;
    private FineTypeDistribution fineTypeDistribution;

    @Data
    @Builder
    public static class TrendPoint {
        private String date;
        private long borrowed;
        private long returned;
    }

    @Data
    @Builder
    public static class ItemStatusDistribution {
        private long available;
        private long borrowed;
        private long reserved;
        private long inMaintenance;
        private long lost;
    }

    @Data
    @Builder
    public static class TopBorrowedPublication {
        private long publicationId;
        private String title;
        private long borrowCount;
        private String coverImageUrl;
    }

    @Data
    @Builder
    public static class FineTypeDistribution {
        private long overdueReturn;
        private long damagedBook;
        private long lostBook;
    }
}