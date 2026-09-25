package com.library.catalog.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

/**
 * Value Object representing a unique identifier for an Author.
 */
@Value
public class PublicationAuthorId {
    Long value;

    private PublicationAuthorId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("PublicationAuthorId cannot be null");
        }
        this.value = value;
    }

    public static PublicationAuthorId of(Long value) {
        return new PublicationAuthorId(value);
    }

    public static PublicationAuthorId generate() {
        return new PublicationAuthorId(TsIdGenerator.next());
    }
}
