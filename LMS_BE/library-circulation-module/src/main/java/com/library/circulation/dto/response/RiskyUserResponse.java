package com.library.circulation.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class RiskyUserResponse {

    private long userId;
    private String studentId;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String profilePictureUrl;
    private int creditScore;
    private RiskyMetrics riskyMetrics;

    @Data
    @Builder
    public static class RiskyMetrics {
        private long overdueCount;
        private long unpaidFineCount;
        private BigDecimal totalUnpaidAmount;
        private long damagedCount;
    }
}