package com.library.catalog.domain.entities;

import com.library.catalog.domain.valueobject.CategoryId;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Category {
    private CategoryId id;
    private String name;
    private String bio;
    private CategoryId parentId; // null for root categories

    public static Category createRoot(String categoryName, String bio) {
        validateCategoryName(categoryName);
        return new Category(CategoryId.generate(), categoryName.trim(), bio, null);
    }

    public static Category createChild(String categoryName, CategoryId parentCategoryId, String bio) {
        validateCategoryName(categoryName);
        if (parentCategoryId == null) {
            throw new IllegalArgumentException("Parent category ID cannot be null for child category");
        }
        return new Category(CategoryId.generate(), categoryName.trim(),bio, parentCategoryId);
    }

    public static Category of(CategoryId id, String categoryName,String bio, CategoryId parentCategoryId) {
        validateCategoryName(categoryName);
        return new Category(id, categoryName.trim(),bio, parentCategoryId);
    }

    private static void validateCategoryName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Category name cannot be null or empty");
        }
        if (name.length() > 100) {
            throw new IllegalArgumentException("Category name must not exceed 100 characters");
        }
    }
}
