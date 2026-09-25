package com.library.recommendation.domain.entity;

import com.library.catalog.domain.valueobject.PublicationId;
import com.library.user.domain.enums.InteractionType;
import com.library.user.domain.valueobject.UserId;
import com.library.user.domain.valueobject.UserInteractionId;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class UserInteraction {
    private UserInteractionId id;
    private UserId userId;
    private InteractionType interactionType;
    private Instant createAt;
    private PublicationId publicationId;

    public static UserInteraction create(UserInteractionId id, UserId userId,
                                                  InteractionType interactionType, Instant timestamp,
                                                  PublicationId publicationId) {
        return new UserInteraction(id, userId, interactionType, timestamp, publicationId);
    }
}
