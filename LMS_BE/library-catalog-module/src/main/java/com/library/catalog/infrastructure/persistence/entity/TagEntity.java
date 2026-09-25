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
@Table(name = "tags", indexes = {
    @Index(name = "idx_tag_name", columnList = "name", unique = true)
})
@Getter
@Setter
@AllArgsConstructor
public class TagEntity extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    public TagEntity() {}
}
