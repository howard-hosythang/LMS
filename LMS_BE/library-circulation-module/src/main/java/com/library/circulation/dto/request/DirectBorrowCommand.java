package com.library.circulation.dto.request;

import jakarta.validation.constraints.NotBlank;

public record DirectBorrowCommand(
    @NotBlank(message = "studentId is required")
    String studentId,

    @NotBlank(message = "barcode is required")
    String barcode
) {}
