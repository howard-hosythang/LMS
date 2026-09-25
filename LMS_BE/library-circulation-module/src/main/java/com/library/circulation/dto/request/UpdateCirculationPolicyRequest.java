package com.library.circulation.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UpdateCirculationPolicyRequest(
    @NotNull @Min(1) @Max(168)
    Integer pickupDeadlineHours,

    @NotNull @Min(1) @Max(365)
    Integer defaultLoanDays,

    @NotNull @Min(1) @Max(50)
    Integer maxActiveBorrows,

    @NotNull @Min(0) @Max(50)
    Integer maxActiveReservations,

    @NotNull @DecimalMin("0")
    BigDecimal overdueFinePerDay,

    @NotNull @DecimalMin("0")
    BigDecimal defaultDepositAmount,

    @NotNull
    Boolean blockBorrowWhenUnpaidFines
) {
}
