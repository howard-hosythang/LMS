package com.library.recommendation.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePublicationRatingRequest {

  private Long transactionId;

  @Min(value = 1, message = "Star must be at least 1")
  @Max(value = 5, message = "Star must be at most 5")
  private int star;

  @NotBlank(message = "Comment must not be blank")
  private String comment;
}
