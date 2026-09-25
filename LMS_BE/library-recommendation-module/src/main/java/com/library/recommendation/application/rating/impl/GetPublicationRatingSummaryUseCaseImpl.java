package com.library.recommendation.application.rating.impl;

import com.library.recommendation.application.rating.GetPublicationRatingSummaryUseCase;
import com.library.recommendation.dto.response.PublicationRatingSummaryResponse;
import com.library.recommendation.infrastructure.persistence.repository.RatingJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetPublicationRatingSummaryUseCaseImpl implements GetPublicationRatingSummaryUseCase {

  private final RatingJpaRepository ratingJpaRepository;

  @Override
  public PublicationRatingSummaryResponse execute(Long publicationId) {
    return ratingJpaRepository.getRatingSummaryByPublicationId(publicationId);
  }
}
