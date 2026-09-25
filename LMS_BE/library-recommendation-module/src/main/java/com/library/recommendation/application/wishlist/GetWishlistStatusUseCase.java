package com.library.recommendation.application.wishlist;

public interface GetWishlistStatusUseCase {
    boolean execute(Long userId, Long publicationId);
}
