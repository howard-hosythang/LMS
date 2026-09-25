package com.library.recommendation.presentation.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.library.recommendation.application.wishlist.AddToWishlistUseCase;
import com.library.recommendation.application.wishlist.ClearWishlistUseCase;
import com.library.recommendation.application.wishlist.GetWishlistStatusUseCase;
import com.library.recommendation.application.wishlist.GetWishlistUseCase;
import com.library.recommendation.application.wishlist.RemoveFromWishlistUseCase;
import com.library.recommendation.dto.WishlistItemResponse;
import com.library.shared.util.SecurityEvaluator;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
@DisplayName("WishlistController — MockMvc")
class WishlistControllerTest {

    private static final Long USER_ID = 4L;

    @Mock SecurityEvaluator security;
    @Mock AddToWishlistUseCase addToWishlistUseCase;
    @Mock RemoveFromWishlistUseCase removeFromWishlistUseCase;
    @Mock ClearWishlistUseCase clearWishlistUseCase;
    @Mock GetWishlistUseCase getWishlistUseCase;
    @Mock GetWishlistStatusUseCase getWishlistStatusUseCase;

    @InjectMocks WishlistController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /wishlist returns current-user wishlist")
    void getMyWishlist_shouldReturnItems() throws Exception {
        WishlistItemResponse item = new WishlistItemResponse(
            1L,
            "Clean Code",
            "https://example.com/cover.jpg",
            "Robert C. Martin",
            2008,
            3,
            1,
            null
        );

        when(security.getCurrentUserId()).thenReturn(USER_ID);
        when(getWishlistUseCase.execute(USER_ID)).thenReturn(List.of(item));

        mockMvc.perform(get("/api/v1/wishlist"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].publicationId").value("1"))
            .andExpect(jsonPath("$.data[0].title").value("Clean Code"));
    }

    @Test
    @DisplayName("POST /wishlist/{publicationId} adds current-user wishlist item")
    void addToWishlist_shouldCallUseCase() throws Exception {
        when(security.getCurrentUserId()).thenReturn(USER_ID);

        mockMvc.perform(post("/api/v1/wishlist/{publicationId}", 10L))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Added to wishlist"));

        verify(addToWishlistUseCase).execute(USER_ID, 10L);
    }

    @Test
    @DisplayName("DELETE /wishlist/{publicationId} removes current-user wishlist item")
    void removeFromWishlist_shouldCallUseCase() throws Exception {
        when(security.getCurrentUserId()).thenReturn(USER_ID);

        mockMvc.perform(delete("/api/v1/wishlist/{publicationId}", 10L))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Removed from wishlist"));

        verify(removeFromWishlistUseCase).execute(USER_ID, 10L);
    }

    @Test
    @DisplayName("DELETE /wishlist clears current-user wishlist")
    void clearWishlist_shouldCallUseCase() throws Exception {
        when(security.getCurrentUserId()).thenReturn(USER_ID);

        mockMvc.perform(delete("/api/v1/wishlist"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Cleared wishlist"));

        verify(clearWishlistUseCase).execute(USER_ID);
    }

    @Test
    @DisplayName("GET /wishlist/{publicationId}/status returns current-user wishlist state")
    void getWishlistStatus_shouldReturnBoolean() throws Exception {
        when(security.getCurrentUserId()).thenReturn(USER_ID);
        when(getWishlistStatusUseCase.execute(USER_ID, 10L)).thenReturn(true);

        mockMvc.perform(get("/api/v1/wishlist/{publicationId}/status", 10L))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").value(true));
    }
}
