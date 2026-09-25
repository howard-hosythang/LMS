package com.library.catalog.domain.entities;

import com.library.catalog.domain.valueobject.CategoryId;
import com.library.catalog.domain.valueobject.PublicationCategoryId;
import com.library.catalog.domain.valueobject.PublicationId;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class PublicationCategory {
    private PublicationCategoryId id;
    private PublicationId publicationId;
    private CategoryId categoryId;

    public static PublicationCategory create(PublicationId publicationId, CategoryId categoryId) {
        return new PublicationCategory(PublicationCategoryId.generate(), publicationId, categoryId);
    }

    public static PublicationCategory of(PublicationCategoryId id, PublicationId publicationId, CategoryId categoryId) {
        return new PublicationCategory(id, publicationId, categoryId);
    }

}
