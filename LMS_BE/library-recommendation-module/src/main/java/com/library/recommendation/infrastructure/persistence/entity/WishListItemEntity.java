package com.library.recommendation.infrastructure.persistence.entity;

import com.library.shared.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "wish_lists_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishListItemEntity extends BaseEntity {
    private Long publicationId;
    private Instant addedAt;
}
