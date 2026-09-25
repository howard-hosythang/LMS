package com.library.recommendation.application.rating.impl;

import com.library.recommendation.application.rating.GetPublicationRatingsUseCase;
import com.library.recommendation.dto.response.PublicationRatingResponse;
import com.library.recommendation.infrastructure.persistence.repository.RatingJpaRepository;
import com.library.shared.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetPublicationRatingsUseCaseImpl implements GetPublicationRatingsUseCase {

  private final RatingJpaRepository ratingJpaRepository;

  @Override
  public PageResponse<PublicationRatingResponse> execute(Long publicationId, int page, int size) {
    return execute(publicationId, page, size, null, "newest");
  }

  @Override
  public PageResponse<PublicationRatingResponse> execute(
      Long publicationId, int page, int size, Integer star, String sort) {
    Pageable pageable = PageRequest.of(page, size, toSort(sort));
    Page<PublicationRatingResponse> ratings = ratingJpaRepository.findAllByPublicationId(
        publicationId, star, pageable);
    return PageResponse.from(ratings);
  }

  private Sort toSort(String sort) {
    return switch (sort == null ? "newest" : sort) {
      case "helpful" -> Sort.by("helpfulCount").descending().and(Sort.by("createdAt").descending());
      case "oldest" -> Sort.by("createdAt").ascending();
      default -> Sort.by("createdAt").descending();
    };
  }
}
