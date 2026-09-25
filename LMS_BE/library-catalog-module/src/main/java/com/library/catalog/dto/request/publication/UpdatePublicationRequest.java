package com.library.catalog.dto.request.publication;

import com.library.catalog.domain.enums.FacultyTarget;
import com.library.catalog.domain.enums.PublicationFormat;

public record UpdatePublicationRequest(
        String isbn,
        String title,
        String subtitle,
        String description,
        String language,
        Integer numberOfPages,
        Integer publicationYear,
        Integer edition,
        PublicationFormat publicationFormat,
        String editionNote,
        String coverImageUrl,
        String size,
        Double weight,
        FacultyTarget aiTargetAudience,
        Long publisherId,
        Long[] authorIds,
        Long[] categoryIds,
        Long[] tagIds,
        String callNumber
) {
}
