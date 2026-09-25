package com.library.catalog.dto.request.publication;

import com.fasterxml.jackson.databind.JsonNode;
import com.library.catalog.domain.enums.FacultyTarget;
import com.library.catalog.domain.enums.PublicationFormat;

public record CreatePublicationRequest (
    String isbn,
    String title,
    String subtitle,
    String description,
    String language,
    Integer numberOfPages,
    String aiSummary,
    FacultyTarget aiTargetAudience,
    Integer publicationYear,
    Integer edition,
    PublicationFormat publicationFormat,
    String editionNote,
    String size, // e.g., "20x15x3 cm"
    Double weight, // in grams
    Long publisherId,
    String coverImageUrl,
    Long[] authorIds,
    Long[] categoryIds,
    Long[] tagIds,
    String callNumber,
    JsonNode tableOfContents
){
}
