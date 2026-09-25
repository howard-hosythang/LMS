package com.library.catalog.dto.response.publication;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SystemReviewResponse {

  @JsonSerialize(using = ToStringSerializer.class)
  private Long reviewId;

  @JsonSerialize(using = ToStringSerializer.class)
  private Long userId;

  private int rating;
  private String comment;
  private String fullName;
  private String role;
  private String studentId;
  private String faculty;
  private String profilePictureUrl;
  private boolean published;
  private boolean satisfied;
  private Instant createdAt;
  private Instant updatedAt;
}
