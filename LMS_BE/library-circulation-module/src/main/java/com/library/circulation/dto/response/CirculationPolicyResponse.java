package com.library.circulation.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import lombok.Builder;

@Builder
public record CirculationPolicyResponse(
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
}
