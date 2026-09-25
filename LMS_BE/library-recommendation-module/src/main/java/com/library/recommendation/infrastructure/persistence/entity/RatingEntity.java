package com.library.recommendation.infrastructure.persistence.entity;

import com.library.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * JPA Entity for book reviews.
 */
@Entity
@Table(name = "ratings", indexes = {
    @Index(name = "idx_rating_user_id", columnList = "userId"),
    @Index(name = "idx_rating_publication_id", columnList = "publicationId"),
    @Index(name = "idx_rating_star", columnList = "star")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RatingEntity extends BaseEntity {

  @Column(nullable = false)
  private Long userId;

  @Column(nullable = false)
  private Long publicationId;

  @Column(name = "transaction_id")
  private Long transactionId;

  @Column(name = "item_barcode", length = 50)
  private String itemBarcode;

  @Column(nullable = false)
  private int star;

  @Column(columnDefinition = "TEXT")
  private String comment;

  @Builder.Default
  private int helpfulCount = 0;

  @Builder.Default
  private Boolean verifiedBorrow = true;
}
