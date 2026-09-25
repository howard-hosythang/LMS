package com.library.recommendation.infrastructure.persistence.entity;

import com.library.shared.entity.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * JPA Entity for user wish lists.
 */
@Entity
@Table(name = "wish_lists")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishListEntity extends BaseEntity {
    private Long userId;

    @OneToMany(
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @JoinColumn(name = "wish_list_id")
    private List<WishListItemEntity> items;
}
