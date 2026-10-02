package com.library.circulation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Builder;

@Builder
public record CirculationPolicyResponse(
    Integer pickupDeadlineHours,
    Integer defaultLoanDays,
    Integer maxActiveBorrows,
    Integer maxActiveReservations,
    Integer maxRenewals,
    Integer renewalWindowDays,
    BigDecimal overdueFinePerDay,
    BigDecimal defaultDepositAmount,
    Boolean blockBorrowWhenUnpaidFines,
    @JsonSerialize(using = ToStringSerializer.class) Long updatedByAdminId,
    String updatedByAdminName,
    Instant updatedAt
) {
}
