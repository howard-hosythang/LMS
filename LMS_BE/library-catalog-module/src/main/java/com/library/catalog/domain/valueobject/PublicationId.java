package com.library.catalog.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

/**
 * Value Object representing a unique identifier for a Publication.
 * Uses TSID (Time-Sorted ID) for distributed, sortable ID generation.
 */
@Value
public class PublicationId {
    Long value;

    private PublicationId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("PublicationId cannot be null");
        }
        this.value = value;
    }

    /**
     * Creates a PublicationId from an existing Long value.
     */
    public static PublicationId of(Long value) {
        return new PublicationId(value);
    }

    /**
     * Generates a new unique PublicationId using TSID.
     */
    public static PublicationId generate() {
        return new PublicationId(TsIdGenerator.next());
    }
}
