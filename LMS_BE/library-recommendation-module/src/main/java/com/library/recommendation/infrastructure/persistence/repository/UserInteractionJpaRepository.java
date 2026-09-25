package com.library.recommendation.infrastructure.persistence.repository;

import com.library.recommendation.infrastructure.persistence.entity.UserInteractionEntity;
import com.library.user.domain.enums.InteractionType;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserInteractionJpaRepository extends JpaRepository<UserInteractionEntity, Long> {

    boolean existsByUserIdAndPublicationIdAndTypeAndCreatedAtAfter(
        Long userId, Long publicationId, InteractionType type, Instant after);
}
