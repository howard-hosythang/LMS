package com.library.recommendation.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

@Value
public class RatingId {
    // properties
    Long value; // private final Long value;


    private RatingId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("Rating ID cannot be null");
        }
        this.value = value;
    }

    public static RatingId of(Long value) {
        return new RatingId(value);
    }

    public static RatingId generate() {
        return new RatingId(TsIdGenerator.next());
    }
}
