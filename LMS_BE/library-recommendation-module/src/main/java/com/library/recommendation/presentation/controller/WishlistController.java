package com.library.recommendation.presentation.controller;

import com.library.recommendation.application.wishlist.AddToWishlistUseCase;
import com.library.recommendation.application.wishlist.ClearWishlistUseCase;
import com.library.recommendation.application.wishlist.GetWishlistStatusUseCase;
import com.library.recommendation.application.wishlist.GetWishlistUseCase;
import com.library.recommendation.application.wishlist.RemoveFromWishlistUseCase;
import com.library.recommendation.dto.WishlistItemResponse;
import com.library.shared.dto.ApiResponseApp;
import com.library.shared.util.RequiresAuthentication;
import com.library.shared.util.SecurityEvaluator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final SecurityEvaluator security;
    private final AddToWishlistUseCase addToWishlistUseCase;
    private final RemoveFromWishlistUseCase removeFromWishlistUseCase;
    private final ClearWishlistUseCase clearWishlistUseCase;
    private final GetWishlistUseCase getWishlistUseCase;
    private final GetWishlistStatusUseCase getWishlistStatusUseCase;

    @GetMapping
    @RequiresAuthentication
    public ApiResponseApp<List<WishlistItemResponse>> getMyWishlist() {
        return ApiResponseApp.success(getWishlistUseCase.execute(security.getCurrentUserId()));
    }

    @PostMapping("/{publicationId}")
    @RequiresAuthentication
    public ApiResponseApp<Void> addToWishlist(
        @PathVariable("publicationId") Long publicationId) {
        addToWishlistUseCase.execute(security.getCurrentUserId(), publicationId);
        return ApiResponseApp.success("Added to wishlist");
    }

    @DeleteMapping("/{publicationId}")
    @RequiresAuthentication
    public ApiResponseApp<Void> removeFromWishlist(
        @PathVariable("publicationId") Long publicationId) {
        removeFromWishlistUseCase.execute(security.getCurrentUserId(), publicationId);
        return ApiResponseApp.deleteSuccess("Removed from wishlist");
    }

    @DeleteMapping
    @RequiresAuthentication
    public ApiResponseApp<Void> clearWishlist() {
        clearWishlistUseCase.execute(security.getCurrentUserId());
        return ApiResponseApp.deleteSuccess("Cleared wishlist");
    }

    @GetMapping("/{publicationId}/status")
    @RequiresAuthentication
    public ApiResponseApp<Boolean> getWishlistStatus(
        @PathVariable("publicationId") Long publicationId) {
        return ApiResponseApp.success(
            getWishlistStatusUseCase.execute(security.getCurrentUserId(), publicationId));
    }
}
