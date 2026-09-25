package com.library.recommendation.application.rating;

import com.library.recommendation.dto.request.CreatePublicationRatingRequest;

public interface CreatePublicationRatingUseCase {

  void execute(Long publicationId, Long userId, CreatePublicationRatingRequest request);
}
