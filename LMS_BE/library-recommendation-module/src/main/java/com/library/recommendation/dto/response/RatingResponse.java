package com.library.recommendation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RatingResponse {

  @JsonSerialize(using = ToStringSerializer.class)
  private Long ratingId;
  private int star;
  private String comment;
  private int helpfulCount;
  private Boolean verifiedBorrow;
}
