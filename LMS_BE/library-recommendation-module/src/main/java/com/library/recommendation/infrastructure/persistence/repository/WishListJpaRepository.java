package com.library.recommendation.infrastructure.persistence.repository;

import com.library.recommendation.infrastructure.persistence.entity.WishListEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WishListJpaRepository extends JpaRepository<WishListEntity, Long> {

    Optional<WishListEntity> findByUserId(Long userId);

    @Query("SELECT COUNT(i) > 0 FROM WishListEntity w JOIN w.items i WHERE w.userId = :userId AND i.publicationId = :publicationId")
    boolean existsByUserIdAndPublicationId(@Param("userId") Long userId, @Param("publicationId") Long publicationId);
}
