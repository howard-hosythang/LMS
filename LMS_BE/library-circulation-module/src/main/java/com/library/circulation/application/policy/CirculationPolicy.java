package com.library.circulation.application.policy;

import java.math.BigDecimal;
import java.time.Instant;

public record CirculationPolicy(
    Integer pickupDeadlineHours,
    Integer defaultLoanDays,
    Integer maxActiveBorrows,
    Integer maxActiveReservations,
    BigDecimal overdueFinePerDay,
    BigDecimal defaultDepositAmount,
    Boolean blockBorrowWhenUnpaidFines,
    Long updatedByAdminId,
    String updatedByAdminName,
    Instant updatedAt
) {
    public CirculationPolicy(
        Integer pickupDeadlineHours,
        Integer defaultLoanDays,
        Integer maxActiveBorrows,
        Integer maxActiveReservations,
        BigDecimal overdueFinePerDay,
        Boolean blockBorrowWhenUnpaidFines,
        Long updatedByAdminId,
        String updatedByAdminName,
        Instant updatedAt
    ) {
        this(
            pickupDeadlineHours,
            defaultLoanDays,
            maxActiveBorrows,
            maxActiveReservations,
            overdueFinePerDay,
            BigDecimal.ZERO,
            blockBorrowWhenUnpaidFines,
            updatedByAdminId,
            updatedByAdminName,
            updatedAt
        );
    }
}
