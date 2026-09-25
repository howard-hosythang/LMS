package com.library.recommendation.domain.entity;

import com.library.recommendation.domain.valueobject.WishListItemId;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class WishListItem {
    private WishListItemId id;
    private Long publicationId;
    private Instant addedAt;

    protected WishListItem() {}

    public static WishListItem create(Long publicationId) {
        return new WishListItem(WishListItemId.generate(), publicationId, Instant.now());
    }
}
