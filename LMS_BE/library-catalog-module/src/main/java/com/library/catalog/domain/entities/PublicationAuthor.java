package com.library.catalog.domain.entities;

import com.library.catalog.domain.valueobject.AuthorId;
import com.library.catalog.domain.valueobject.PublicationAuthorId;
import com.library.catalog.domain.valueobject.PublicationId;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class PublicationAuthor {
    private PublicationAuthorId id;
    private PublicationId publicationId;
    private AuthorId authorId;

    public static PublicationAuthor create(PublicationId publicationId, AuthorId authorId) {
        return new PublicationAuthor(PublicationAuthorId.generate(), publicationId, authorId);
    }

    public static PublicationAuthor of(PublicationAuthorId id, PublicationId publicationId, AuthorId authorId) {
        return new PublicationAuthor(id, publicationId, authorId);
    }
}
