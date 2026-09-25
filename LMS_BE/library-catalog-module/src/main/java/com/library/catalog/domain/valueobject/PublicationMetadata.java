package com.library.catalog.domain.valueobject;

import com.library.catalog.domain.enums.FacultyTarget;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Value;


@Value
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class PublicationMetadata {
    String title;
    String subtitle;
    String description;
    String language;
    Integer numberOfPages;
    String aiSummary;
    FacultyTarget aiTargetAudience;
    String fileUrl;
    Integer publicationYear;
    Integer edition;
    String coverImageUrl;
    String size;
    Double weight;
}
