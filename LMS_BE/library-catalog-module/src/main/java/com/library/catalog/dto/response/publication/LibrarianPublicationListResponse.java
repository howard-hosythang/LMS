package com.library.catalog.dto.response.publication;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LibrarianPublicationListResponse {

  @JsonSerialize(using = ToStringSerializer.class)
  private Long publicationId;
  private String title;
  private String subtitle;
  private String coverImageUrl;
  private List<String> authorNames;
  private Integer publicationYear;
  private Long totalItems;
  private Long availableItems;
  private String isbn;
  private String publisherName;
  private String categoryNames;
  private Instant createdAt;
  private String aiProcessingStatus;
  private String aiProcessingError;
  private Instant aiProcessedAt;
}
