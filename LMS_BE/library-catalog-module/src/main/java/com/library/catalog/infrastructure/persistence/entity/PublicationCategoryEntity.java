package com.library.catalog.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "publication_categories")
@Getter
@Setter
@AllArgsConstructor
public class PublicationCategoryEntity {
    @Id
    private Long id;

    @Column(name = "publication_id")
    private Long publicationId;

    @Column(name = "category_id")
    private Long categoryId;

    protected PublicationCategoryEntity() {}
}
