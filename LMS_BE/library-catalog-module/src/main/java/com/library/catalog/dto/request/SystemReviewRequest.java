package com.library.catalog.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SystemReviewRequest {

  @Min(value = 1, message = "Rating must be at least 1")
  @Max(value = 5, message = "Rating must be at most 5")
  private int rating;

  @NotBlank(message = "Comment must not be blank")
  @Size(max = 1200, message = "Comment must be at most 1200 characters")
  private String comment;
}
