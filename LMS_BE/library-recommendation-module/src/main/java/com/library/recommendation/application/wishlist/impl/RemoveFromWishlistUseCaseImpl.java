package com.library.recommendation.application.wishlist.impl;

import com.library.recommendation.application.wishlist.RemoveFromWishlistUseCase;
import com.library.recommendation.infrastructure.persistence.repository.WishListJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RemoveFromWishlistUseCaseImpl implements RemoveFromWishlistUseCase {

    private final WishListJpaRepository wishListRepository;

    @Override
    @Transactional
    public void execute(Long userId, Long publicationId) {
        wishListRepository.findByUserId(userId).ifPresent(wishList -> {
            wishList.getItems().removeIf(i -> i.getPublicationId().equals(publicationId));
            wishListRepository.save(wishList);
            log.info("User {} removed publication {} from wishlist", userId, publicationId);
        });
    }
}
