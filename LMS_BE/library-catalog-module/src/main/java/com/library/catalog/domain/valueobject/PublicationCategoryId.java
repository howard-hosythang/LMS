package com.library.catalog.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

/**
 * Value Object representing a unique identifier for an Author.
 */
@Value
public class PublicationCategoryId {
    Long value;

    private PublicationCategoryId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("PublicationCategoryId cannot be null");
        }
        this.value = value;
    }

    public static PublicationCategoryId of(Long value) {
        return new PublicationCategoryId(value);
    }

    public static PublicationCategoryId generate() {
        return new PublicationCategoryId(TsIdGenerator.next());
    }
}
