package com.library.catalog.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

/**
 * Value Object representing a unique identifier for an Item (physical/digital copy).
 */
@Value
public class ItemId {
    Long value;

    private ItemId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("ItemId cannot be null");
        }
        this.value = value;
    }

    public static ItemId of(Long value) {
        return new ItemId(value);
    }

    public static ItemId generate() {
        return new ItemId(TsIdGenerator.next());
    }
}
