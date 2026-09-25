package com.library.circulation.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record RestoreLostBookCommand(
    String barcode,

    @NotBlank(message = "newItemStatus is required")
    String newItemStatus,

    @NotNull(message = "refundAmount is required")
    @DecimalMin(value = "0", message = "refundAmount must be zero or positive")
    BigDecimal refundAmount,

    @NotBlank(message = "recoveryReason is required")
    String recoveryReason,

    String note
) {}
