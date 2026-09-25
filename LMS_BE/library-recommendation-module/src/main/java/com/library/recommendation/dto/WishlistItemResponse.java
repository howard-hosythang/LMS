package com.library.recommendation.dto;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.time.Instant;

public record WishlistItemResponse(
    @JsonSerialize(using = ToStringSerializer.class) Long publicationId,
    String title,
    String coverImageUrl,
    String authorNames,
    Integer publicationYear,
    Integer totalItems,
    Integer availableItems,
    Instant addedAt
) {}
