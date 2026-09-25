package com.library.recommendation.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PublicationRatingSummaryResponse {

  private Long fiveStarCount;
  private Long fourStarCount;
  private Long threeStarCount;
  private Long twoStarCount;
  private Long oneStarCount;
  private Long totalCount;
}
