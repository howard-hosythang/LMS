package com.library.catalog.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "publication_tags")
@Getter
@Setter
@AllArgsConstructor
public class PublicationTagEntity {
    @Id
    private Long id;

    @Column(name = "publication_id", nullable = false)
    private Long publicationId;

    @Column(name = "tag_id", nullable = false)
    private Long tagId;

    protected PublicationTagEntity() {}
}
