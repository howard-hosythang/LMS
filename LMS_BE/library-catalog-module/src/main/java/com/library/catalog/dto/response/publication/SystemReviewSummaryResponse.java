package com.library.catalog.dto.response.publication;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SystemReviewSummaryResponse {

  private long totalReviews;
  private long satisfiedReviews;
  private double averageRating;
  private int satisfactionPercent;
}
