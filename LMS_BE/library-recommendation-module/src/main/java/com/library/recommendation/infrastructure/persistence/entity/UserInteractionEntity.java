package com.library.recommendation.infrastructure.persistence.entity;

import com.library.shared.entity.BaseEntity;
import com.library.user.domain.enums.InteractionType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * JPA Entity for user interactions.
 */
@Entity
@Table(name = "user_interactions", indexes = {
    @Index(name = "idx_interaction_user_id", columnList = "userId"),
    @Index(name = "idx_interaction_timestamp", columnList = "createdAt")
})
@Getter
@Setter
@AllArgsConstructor
@Builder
public class UserInteractionEntity extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "publication_id", nullable = false)
    private Long publicationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private InteractionType type;

    protected UserInteractionEntity() {
        // Default constructor for JPA
    }
}
