package com.library.circulation.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record UpdateFineAmountRequest(
    @NotNull @DecimalMin("1") @DecimalMax("10000000") @Digits(integer = 8, fraction = 0)
    BigDecimal fineAmount,
    @Size(max = 500) String reason
) {}
