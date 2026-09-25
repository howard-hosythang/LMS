package com.library.recommendation.application.wishlist.impl;

import com.library.recommendation.application.wishlist.AddToWishlistUseCase;
import com.library.recommendation.infrastructure.persistence.entity.WishListEntity;
import com.library.recommendation.infrastructure.persistence.entity.WishListItemEntity;
import com.library.recommendation.infrastructure.persistence.repository.WishListJpaRepository;
import com.library.shared.port.UserInteractionPort;
import com.library.shared.util.TsIdGenerator;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AddToWishlistUseCaseImpl implements AddToWishlistUseCase {

    private final WishListJpaRepository wishListRepository;
    private final UserInteractionPort userInteractionPort;

    @Override
    @Transactional
    public void execute(Long userId, Long publicationId) {
        WishListEntity wishList = wishListRepository.findByUserId(userId)
            .orElseGet(() -> {
                WishListEntity newList = new WishListEntity();
                newList.setId(TsIdGenerator.next());
                newList.setUserId(userId);
                newList.setItems(new java.util.ArrayList<>());
                return wishListRepository.save(newList);
            });

        boolean alreadyAdded = wishList.getItems().stream()
            .anyMatch(i -> i.getPublicationId().equals(publicationId));

        if (alreadyAdded) {
            return; // idempotent
        }

        WishListItemEntity item = new WishListItemEntity();
        item.setId(TsIdGenerator.next());
        item.setPublicationId(publicationId);
        item.setAddedAt(Instant.now());
        wishList.getItems().add(item);
        wishListRepository.save(wishList);

        userInteractionPort.record(userId, publicationId, UserInteractionPort.TYPE_WISHLIST);

        log.info("User {} added publication {} to wishlist", userId, publicationId);
    }
}
