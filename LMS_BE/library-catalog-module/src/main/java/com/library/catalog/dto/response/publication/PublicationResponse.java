package com.library.catalog.dto.response.publication;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.library.catalog.domain.enums.FacultyTarget;
import com.library.catalog.domain.enums.PublicationFormat;
import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PublicationResponse {
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;
    private String isbn;
    private String title;
    private String subtitle;
    private String description;
    private String language;
    private Integer numberOfPages;
    private String aiSummary;
    private FacultyTarget aiTargetAudience;
    private String fileUrl;
    private Integer publicationYear;
    private Integer edition;
    private PublicationFormat publicationFormat;
    private String editionNote;
    private String coverImageUrl;
    private String size; // e.g., "20x15x3 cm"
    private Double weight; // in grams
    private String callNumber;
    private Long borrowCount;
    private Long viewCount;
    private String aiProcessingStatus;
    private String aiProcessingError;
    private Integer aiChunksCount;
    private Integer aiVectorsCount;
    private Instant aiProcessedAt;
    private String tableOfContents;
}
