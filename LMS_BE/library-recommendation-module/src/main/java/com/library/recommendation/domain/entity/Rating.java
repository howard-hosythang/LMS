package com.library.recommendation.domain.entity;

import com.library.catalog.domain.valueobject.PublicationId;
import com.library.recommendation.domain.valueobject.RatingMetadata;
import com.library.recommendation.domain.valueobject.RatingId;
import com.library.user.domain.valueobject.UserId;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;


@Getter
@AllArgsConstructor(access = lombok.AccessLevel.PRIVATE)
public class Rating {
    private RatingId id;
    private UserId userId;
    private PublicationId publicationId;
    private RatingMetadata metadata; // 1-5 stars
    private Integer helpfulCount; // Number of users who found this review helpful
    private Boolean verifiedBorrow; // User actually borrowed this book
    private Instant createdAt;


    public static Rating create(RatingId id, UserId userId, PublicationId publicationId, RatingMetadata metadata,
                                Integer helpfulCount, Boolean verifiedBorrow, Instant createdAt) {
        return new Rating(id, userId, publicationId, metadata, helpfulCount, verifiedBorrow, createdAt);
    }
    public void markAsHelpful() {
        if (this.helpfulCount == null) {
            this.helpfulCount = 0;
        }
        this.helpfulCount++;
    }
}
