package com.library.circulation.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ReturnCommand(
    @NotBlank(message = "barcode is required")
    String barcode
) {}
