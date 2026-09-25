package com.library.catalog.dto.response.publication;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PublicLibraryStatsResponse {
  private long totalPublications;
  private long activeUsers;
  private long totalBorrows;
  private long totalCategories;
  private double averageRating;
  private long totalRatings;
  private int satisfactionPercent;
}
