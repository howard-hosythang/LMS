package com.library.catalog.infrastructure.persistence.entity;

import com.library.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "categories", indexes = {
    @Index(name = "idx_category_name", columnList = "name", unique = true),
    @Index(name = "idx_parent_category", columnList = "parent_category_id")
})
@Getter
@Setter
@AllArgsConstructor
public class CategoryEntity extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "parent_category_id")
    private Long parentCategoryId; // Self-reference for hierarchy

    public CategoryEntity() {}
}
