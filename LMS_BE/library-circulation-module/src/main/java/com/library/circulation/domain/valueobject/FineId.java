package com.library.circulation.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

/**
 * Value Object representing a unique identifier for Fine.
 */
@Value
public class FineId {
    Long value;

    private FineId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("FineId cannot be null");
        }
        this.value = value;
    }

    public static FineId of(Long value) {
        return new FineId(value);
    }

    public static FineId generate() {
        return new FineId(TsIdGenerator.next());
    }
}
