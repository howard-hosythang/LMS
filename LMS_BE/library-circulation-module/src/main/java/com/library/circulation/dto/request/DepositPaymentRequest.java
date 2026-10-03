package com.library.circulation.dto.request;

import jakarta.validation.constraints.NotBlank;

public record DepositPaymentRequest(@NotBlank String flow, String studentId, String barcode, Long sourceId) {}
