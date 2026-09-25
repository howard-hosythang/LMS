package com.library.catalog.dto.response.publication;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.time.Instant;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MostBorrowedPublicationsResponse {

  @JsonSerialize(using = ToStringSerializer.class)
  private Long publicationId;
  private String title;
  private String coverImageUrl;
  private Integer publicationYear;
  private Instant createdAt;
  private Integer availableItems;
  private List<String> authorNames;
  private Double ratingAverage;
  private Integer ratingCount;
  private Long borrowCount;
}
