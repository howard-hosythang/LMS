package com.library.catalog.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

/**
 * Value Object representing a unique identifier for an Author.
 */
@Value
public class AuthorId {
    Long value;

    private AuthorId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("AuthorId cannot be null");
        }
        this.value = value;
    }

    public static AuthorId of(Long value) {
        return new AuthorId(value);
    }

    public static AuthorId generate() {
        return new AuthorId(TsIdGenerator.next());
    }
}
