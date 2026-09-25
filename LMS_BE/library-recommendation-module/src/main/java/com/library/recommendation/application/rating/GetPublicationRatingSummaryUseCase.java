package com.library.recommendation.application.rating;

import com.library.recommendation.dto.response.PublicationRatingSummaryResponse;

public interface GetPublicationRatingSummaryUseCase {

  PublicationRatingSummaryResponse execute(Long publicationId);
}
