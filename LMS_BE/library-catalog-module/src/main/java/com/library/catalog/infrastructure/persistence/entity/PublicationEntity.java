package com.library.catalog.infrastructure.persistence.entity;

import com.library.catalog.domain.enums.FacultyTarget;
import com.library.catalog.domain.enums.PublicationFormat;
import com.library.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "publications")
@Getter
@Setter
@AllArgsConstructor
public class PublicationEntity extends BaseEntity {

    @Column(length = 100, unique = true)
    private String isbn;

    @Column(nullable = false)
    private String title;
    private String subtitle;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String language;
    private Integer numberOfPages;

    @Column(columnDefinition = "TEXT")
    private String aiSummary;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "TEXT")
    private FacultyTarget aiTargetAudience;

    @Column(columnDefinition = "TEXT")
    private String fileUrl;
    private Integer publicationYear;
    private Integer edition;

    @Enumerated(EnumType.STRING)
    @Column(name = "publication_format", length = 40)
    private PublicationFormat publicationFormat;

    @Column(name = "edition_note", length = 255)
    private String editionNote;

    @Column(columnDefinition = "TEXT")
    private String coverImageUrl;

    @Column(length = 50)
    private String size; // e.g., "20x15x3 cm"
    private Double weight; // in grams

    @Column(name = "call_number", length = 100)
    private String callNumber;

    @Column(name = "table_of_contents", columnDefinition = "TEXT")
    private String tableOfContents;

    private Long publisherId;

    @Column(name = "created_by_librarian_id")
    private Long createdByLibrarianId;

    @Column(name = "updated_by_librarian_id")
    private Long updatedByLibrarianId;

    public PublicationEntity() {}
}
