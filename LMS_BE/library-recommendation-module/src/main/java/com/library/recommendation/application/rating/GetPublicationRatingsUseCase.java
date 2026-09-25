package com.library.recommendation.application.rating;

import com.library.recommendation.dto.response.PublicationRatingResponse;
import com.library.shared.dto.PageResponse;

public interface GetPublicationRatingsUseCase {

  PageResponse<PublicationRatingResponse> execute(Long publicationId, int page, int size);

  PageResponse<PublicationRatingResponse> execute(Long publicationId, int page, int size, Integer star, String sort);
}
