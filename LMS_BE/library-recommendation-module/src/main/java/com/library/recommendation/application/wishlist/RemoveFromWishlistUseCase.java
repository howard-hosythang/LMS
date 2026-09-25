package com.library.recommendation.application.wishlist;

public interface RemoveFromWishlistUseCase {
    void execute(Long userId, Long publicationId);
}
