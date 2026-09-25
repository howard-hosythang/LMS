package com.library.catalog.domain.entities;

import com.library.catalog.domain.valueobject.TagId;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Tag {
    private TagId id;
    private String name;

    public static Tag create(String tagName) {
        validateTagName(tagName);
        return new Tag(TagId.generate(), tagName.trim().toLowerCase());
    }

    public static Tag of(TagId id, String tagName) {
        validateTagName(tagName);
        return new Tag(id, tagName.trim().toLowerCase());
    }

    private static void validateTagName(String tagName) {
        if (tagName == null || tagName.isBlank()) {
            throw new IllegalArgumentException("Tag name cannot be null or empty");
        }
        if (tagName.length() > 50) {
            throw new IllegalArgumentException("Tag name must not exceed 50 characters");
        }
    }
}
