package com.library.circulation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Builder;

@Builder
public record DashboardReportResponse(
    LocalDate dateFrom,
    LocalDate dateTo,
    InventorySection inventory,
    CirculationSection circulation,
    FinanceSection finance,
    IncidentSection incidents,
    List<TrendRow> trend,
    List<TopBorrowedPublication> topBorrowedPublications,
    List<RiskyReaderRow> riskyReaders,
    List<String> librarianNotes
) {
    @Builder
    public record InventorySection(
        long totalItems,
        long availableItems,
        long borrowedItems,
        long reservedItems,
        long maintenanceItems,
        long lostItems,
        long itemsAddedInPeriod,
        long publicationsAddedInPeriod
    ) {}

    @Builder
    public record CirculationSection(
        long borrowCount,
        long returnCount,
        long activeBorrowCount,
        long overdueCurrentCount,
        long waitingPickupCount,
        long reservationPendingCount,
        BigDecimal returnRatePercent
    ) {}

    @Builder
    public record FinanceSection(
        BigDecimal depositsCollected,
        BigDecimal depositsRefunded,
        BigDecimal depositsAppliedToFines,
        BigDecimal additionalAmountDue,
        BigDecimal finesCreated,
        BigDecimal finesCollected,
        BigDecimal unpaidFineOutstanding,
        BigDecimal lostBookRefunds,
        BigDecimal netCashInPeriod
    ) {}

    @Builder
    public record IncidentSection(
        long overdueFineCount,
        long damagedFineCount,
        long lostFineCount,
        long recoveredLostBookCount
    ) {}

    @Builder
    public record TrendRow(
        String label,
        long borrowed,
        long returned,
        BigDecimal depositsCollected,
        BigDecimal finesCollected
    ) {}

    @Builder
    public record TopBorrowedPublication(
        @JsonSerialize(using = ToStringSerializer.class) Long publicationId,
        String title,
        long borrowCount
    ) {}

    @Builder
    public record RiskyReaderRow(
        @JsonSerialize(using = ToStringSerializer.class) Long userId,
        String studentId,
        String fullName,
        String email,
        String phoneNumber,
        int creditScore,
        long overdueCount,
        long unpaidFineCount,
        BigDecimal totalUnpaidAmount,
        long damagedCount
    ) {}
}
