package com.library.catalog.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

/**
 * Value Object representing a unique identifier for a Tag.
 */
@Value
public class TagId {
    Long value;

    private TagId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("TagId cannot be null");
        }
        this.value = value;
    }

    public static TagId of(Long value) {
        return new TagId(value);
    }

    public static TagId generate() {
        return new TagId(TsIdGenerator.next());
    }
}
