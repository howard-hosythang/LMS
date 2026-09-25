package com.library.recommendation.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

@Value
public class WishListItemId {
    Long value;

    private WishListItemId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("WishListItem ID cannot be null");
        }
        this.value = value;
    }

    public static WishListItemId of(Long value) {
        return new WishListItemId(value);
    }

    public static WishListItemId generate() {
        return new WishListItemId(TsIdGenerator.next());
    }
}
