package com.library.catalog.dto.response.publication;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PublicTestimonialResponse {
  @JsonSerialize(using = ToStringSerializer.class)
  private Long ratingId;
  private int star;
  private String comment;
  private String fullName;
  private String role;
  private String profilePictureUrl;
  @JsonSerialize(using = ToStringSerializer.class)
  private Long publicationId;
  private String publicationTitle;
}
