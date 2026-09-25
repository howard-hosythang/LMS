package com.library.recommendation.application.wishlist.impl;

import com.library.recommendation.application.wishlist.GetWishlistStatusUseCase;
import com.library.recommendation.infrastructure.persistence.repository.WishListJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetWishlistStatusUseCaseImpl implements GetWishlistStatusUseCase {

    private final WishListJpaRepository wishListRepository;

    @Override
    public boolean execute(Long userId, Long publicationId) {
        return wishListRepository.existsByUserIdAndPublicationId(userId, publicationId);
    }
}
