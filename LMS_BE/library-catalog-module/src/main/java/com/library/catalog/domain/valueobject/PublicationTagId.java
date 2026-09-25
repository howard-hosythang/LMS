package com.library.catalog.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

/**
 * Value Object representing a unique identifier for an Author.
 */
@Value
public class PublicationTagId {
    Long value;

    private PublicationTagId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("PublicationTagId cannot be null");
        }
        this.value = value;
    }

    public static PublicationTagId of(Long value) {
        return new PublicationTagId(value);
    }

    public static PublicationTagId generate() {
        return new PublicationTagId(TsIdGenerator.next());
    }
}
