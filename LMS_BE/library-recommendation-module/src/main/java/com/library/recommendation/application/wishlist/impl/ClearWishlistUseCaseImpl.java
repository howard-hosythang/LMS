package com.library.recommendation.application.wishlist.impl;

import com.library.recommendation.application.wishlist.ClearWishlistUseCase;
import com.library.recommendation.infrastructure.persistence.repository.WishListJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClearWishlistUseCaseImpl implements ClearWishlistUseCase {

    private final WishListJpaRepository wishListRepository;

    @Override
    @Transactional
    public void execute(Long userId) {
        wishListRepository.findByUserId(userId).ifPresent(wishList -> {
            if (wishList.getItems() != null) {
                int removedCount = wishList.getItems().size();
                wishList.getItems().clear();
                wishListRepository.save(wishList);
                log.info("User {} cleared wishlist, removed {} items", userId, removedCount);
            }
        });
    }
}
