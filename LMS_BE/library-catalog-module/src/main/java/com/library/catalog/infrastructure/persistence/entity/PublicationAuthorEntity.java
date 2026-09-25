package com.library.catalog.infrastructure.persistence.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "publication_authors")
@Getter
@Setter
@AllArgsConstructor
public class PublicationAuthorEntity {
    @Id
    private Long id;
    private Long publicationId;
    private Long authorId;

    protected PublicationAuthorEntity() {}
}
