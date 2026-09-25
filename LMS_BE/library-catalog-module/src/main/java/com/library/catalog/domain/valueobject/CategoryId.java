package com.library.catalog.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

/**
 * Value Object representing a unique identifier for a Category.
 */
@Value
public class CategoryId {
    Long value;

    private CategoryId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("CategoryId cannot be null");
        }
        this.value = value;
    }

    public static CategoryId of(Long value) {
        return new CategoryId(value);
    }

    public static CategoryId generate() {
        return new CategoryId(TsIdGenerator.next());
    }
}
