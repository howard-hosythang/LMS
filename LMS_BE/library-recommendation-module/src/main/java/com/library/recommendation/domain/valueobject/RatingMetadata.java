package com.library.recommendation.domain.valueobject;

import lombok.Value;

@Value
public class RatingMetadata {
    private static final int MIN_STAR = 1;
    private static final int MAX_STAR = 5;

    int star; // private final int value (do lambok)
    String comment;

    private RatingMetadata(int star, String comment) {
        if (star < MIN_STAR || star > MAX_STAR) {
            throw new IllegalArgumentException(
                String.format("Star must be between %d and %d", MIN_STAR, MAX_STAR)
            );
        }
        if (comment != null && comment.trim().isEmpty()) {
            throw new IllegalArgumentException("Comment cannot be empty");
        }

        this.comment = comment;
        this.star = star;
    }

    public static RatingMetadata of(int value, String comment) {
        return new RatingMetadata(value, comment);
    }
}
