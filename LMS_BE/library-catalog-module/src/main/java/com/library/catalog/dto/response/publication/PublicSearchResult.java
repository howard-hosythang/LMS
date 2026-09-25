package com.library.catalog.dto.response.publication;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;

public record PublicSearchResult(
    @JsonSerialize(using = ToStringSerializer.class) Long publicationId,
    String title,
    String coverImageUrl,
    Integer publicationYear,
    String description,
    String publisherName,
    String authorNames,
    String categoryNames,
    String tagNames,
    int totalItems,
    int availableItems,
    double avgRating,
    long borrowCount,
    long viewCount
) {}
