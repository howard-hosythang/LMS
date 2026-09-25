package com.library.catalog.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

/**
 * Value Object representing a unique identifier for a Publisher.
 */
@Value
public class PublisherId {
    Long value;

    private PublisherId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("PublisherId cannot be null");
        }
        this.value = value;
    }

    public static PublisherId of(Long value) {
        return new PublisherId(value);
    }

    public static PublisherId generate() {
        return new PublisherId(TsIdGenerator.next());
    }
}
