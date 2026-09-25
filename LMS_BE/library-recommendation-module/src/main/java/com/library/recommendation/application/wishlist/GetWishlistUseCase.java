package com.library.recommendation.application.wishlist;

import com.library.recommendation.dto.WishlistItemResponse;
import java.util.List;

public interface GetWishlistUseCase {
    List<WishlistItemResponse> execute(Long userId);
}
