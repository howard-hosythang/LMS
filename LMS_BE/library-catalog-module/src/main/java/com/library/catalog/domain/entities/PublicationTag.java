package com.library.catalog.domain.entities;

import com.library.catalog.domain.valueobject.PublicationId;
import com.library.catalog.domain.valueobject.PublicationTagId;
import com.library.catalog.domain.valueobject.TagId;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class PublicationTag {
    private PublicationTagId id;
    private PublicationId publicationId;
    private TagId tagId;

    private PublicationTag() {
    }

    public static PublicationTag create(PublicationId publicationId, TagId tagId) {
        return new PublicationTag(PublicationTagId.generate(), publicationId, tagId);
    }

    public static PublicationTag of(PublicationTagId id, PublicationId publicationId, TagId tagId) {
        return new PublicationTag(id, publicationId, tagId);
    }
}
