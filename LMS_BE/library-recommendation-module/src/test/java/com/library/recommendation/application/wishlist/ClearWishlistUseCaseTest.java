package com.library.recommendation.application.wishlist;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.library.recommendation.application.wishlist.impl.ClearWishlistUseCaseImpl;
import com.library.recommendation.infrastructure.persistence.entity.WishListEntity;
import com.library.recommendation.infrastructure.persistence.entity.WishListItemEntity;
import com.library.recommendation.infrastructure.persistence.repository.WishListJpaRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("ClearWishlistUseCase — Unit Tests")
class ClearWishlistUseCaseTest {

  @Mock private WishListJpaRepository wishListRepository;

  @InjectMocks private ClearWishlistUseCaseImpl useCase;

  @Test
  @DisplayName("Xóa toàn bộ item trong wishlist và lưu lại aggregate")
  void clearWishlist_removesAllItemsAndSaves() {
    Long userId = 1001L;
    WishListEntity wishList = WishListEntity.builder()
        .userId(userId)
        .items(new ArrayList<>(List.of(
            WishListItemEntity.builder().publicationId(1L).addedAt(Instant.now()).build(),
            WishListItemEntity.builder().publicationId(2L).addedAt(Instant.now()).build()
        )))
        .build();
    when(wishListRepository.findByUserId(userId)).thenReturn(Optional.of(wishList));

    useCase.execute(userId);

    assertThat(wishList.getItems()).isEmpty();
    verify(wishListRepository).save(wishList);
  }

  @Test
  @DisplayName("Không làm gì khi user chưa có wishlist")
  void clearWishlist_noopWhenWishlistMissing() {
    Long userId = 1001L;
    when(wishListRepository.findByUserId(userId)).thenReturn(Optional.empty());

    useCase.execute(userId);

    verify(wishListRepository, never()).save(org.mockito.ArgumentMatchers.any());
  }
}
