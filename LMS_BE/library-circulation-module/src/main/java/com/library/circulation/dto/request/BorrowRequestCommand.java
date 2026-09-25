package com.library.circulation.dto.request;

import jakarta.validation.constraints.NotNull;

public record BorrowRequestCommand(
    @NotNull(message = "itemId is required")
    Long itemId
) {}
