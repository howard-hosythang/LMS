package com.library.catalog.domain.event;

import com.library.catalog.domain.entities.ItemStatus;
import com.library.catalog.domain.valueobject.ItemId;

import java.time.LocalDateTime;

/**
 * Domain event fired when an item's status changes.
 */
public record ItemStatusChangedEvent(
    ItemId itemId,
    ItemStatus oldStatus,
    ItemStatus newStatus,
    LocalDateTime occurredAt
) {
    public ItemStatusChangedEvent(ItemId itemId, ItemStatus oldStatus, ItemStatus newStatus) {
        this(itemId, oldStatus, newStatus, LocalDateTime.now());
    }
}
