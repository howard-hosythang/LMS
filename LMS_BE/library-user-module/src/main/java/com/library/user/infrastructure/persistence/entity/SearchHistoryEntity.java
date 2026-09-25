package com.library.user.infrastructure.persistence.entity;

import com.library.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

/**
 * JPA Entity for user search history.
 */
@Entity
@Table(name = "search_history", indexes = {
    @Index(name = "idx_search_user_id", columnList = "userId")
})
@Getter
@Setter
@AllArgsConstructor
@Builder
public class SearchHistoryEntity extends BaseEntity {

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(name = "search_query", nullable = false, columnDefinition = "TEXT")
  private String searchQuery;

  protected SearchHistoryEntity() {
    // JPA requires a default constructor
  }
}
