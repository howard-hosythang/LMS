package com.library.recommendation.domain.entity;

import com.library.recommendation.domain.valueobject.WishListId;
import com.library.user.domain.valueobject.UserId;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Getter
public class WishList {
    private WishListId id;
    private UserId userId;
    private List<WishListItem> items;

    private WishList(WishListId id, UserId userId, List<WishListItem> items) {
        this.id = id;
        this.userId = userId;
        this.items = items != null ? new ArrayList<>(items) : new ArrayList<>();
    }

    public static WishList create(WishListId id, UserId userId) {
        return new WishList(id, userId, new ArrayList<>());
    }

    public static WishList createForMapper(WishListId id, UserId userId, List<WishListItem> items) {
        return new WishList(id, userId, items);
    }

    public void addItem(WishListItem item) {
        if (item != null) {
            items.add(item);
        }
    }

    public void removeItem(WishListItem item) {
        items.remove(item);
    }
}
