package com.library.recommendation.application.wishlist;

public interface AddToWishlistUseCase {
    void execute(Long userId, Long publicationId);
}
