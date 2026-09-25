package com.library.circulation.dto.request;

public record CreateReservationCommand(
    Long publicationId,
    String preferredBranch
) {}
