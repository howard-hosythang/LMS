package com.library.user.domain.enums;

import lombok.Getter;

@Getter
public enum InteractionType {

    WATCH(1),
    WISHLIST(5),
    BORROWED(10);

    private final int point;

    InteractionType(int point) {
        this.point = point;
    }
}
