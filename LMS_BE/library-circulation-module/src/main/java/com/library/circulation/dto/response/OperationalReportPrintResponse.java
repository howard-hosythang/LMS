package com.library.circulation.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OperationalReportPrintResponse(
    DashboardReportResponse report, Instant generatedAt, String preparedBy,
    BigDecimal onTimeReturnRatePercent, BigDecimal depositsHeld, long overdueInPeriod,
    List<RiskReader> riskyReaders
) {
    public record RiskReader(String studentId, String fullName, String faculty, String email,
        String phoneNumber, long overdueCount, BigDecimal totalUnpaidAmount, int creditScore) {}
}
