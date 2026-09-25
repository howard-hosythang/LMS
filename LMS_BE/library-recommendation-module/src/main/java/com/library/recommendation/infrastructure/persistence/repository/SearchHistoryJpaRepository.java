package com.library.recommendation.infrastructure.persistence.repository;

import com.library.user.infrastructure.persistence.entity.SearchHistoryEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SearchHistoryJpaRepository extends JpaRepository<SearchHistoryEntity, Long> {

    @Query("SELECT s FROM SearchHistoryEntity s WHERE s.userId = :userId ORDER BY COALESCE(s.updatedAt, s.createdAt) DESC LIMIT 10")
    List<SearchHistoryEntity> findRecentByUserId(@Param("userId") Long userId);

    @Query("SELECT s FROM SearchHistoryEntity s WHERE s.userId = :userId AND LOWER(s.searchQuery) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY COALESCE(s.updatedAt, s.createdAt) DESC LIMIT 10")
    List<SearchHistoryEntity> findByUserIdAndKeywordContaining(@Param("userId") Long userId, @Param("keyword") String keyword);

    Optional<SearchHistoryEntity> findByUserIdAndSearchQuery(Long userId, String searchQuery);

    long countByUserId(Long userId);

    @Query("SELECT s FROM SearchHistoryEntity s WHERE s.userId = :userId ORDER BY s.updatedAt ASC LIMIT 1")
    Optional<SearchHistoryEntity> findOldestByUserId(@Param("userId") Long userId);
}
