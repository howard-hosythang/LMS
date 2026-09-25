package com.library.recommendation.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

@Value
public class WishListId {
    Long value;

    private WishListId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("WishList ID cannot be null");
        }
        this.value = value;
    }

    public static WishListId of(Long value) {
        return new WishListId(value);
    }

    public static WishListId generate() {
        return new WishListId(TsIdGenerator.next());
    }
}
