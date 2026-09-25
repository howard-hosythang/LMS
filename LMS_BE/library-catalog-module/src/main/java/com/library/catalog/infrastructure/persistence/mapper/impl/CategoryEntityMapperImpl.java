package com.library.catalog.infrastructure.persistence.mapper.impl;

import com.library.catalog.domain.entities.Category;
import com.library.catalog.domain.valueobject.CategoryId;
import com.library.catalog.infrastructure.persistence.entity.CategoryEntity;
import com.library.catalog.infrastructure.persistence.mapper.CategoryEntityMapper;
import org.springframework.stereotype.Component;

@Component
public class CategoryEntityMapperImpl implements CategoryEntityMapper {

    @Override
    public Category toDomain(CategoryEntity entity) {
        return Category.of(
                CategoryId.of(entity.getId()),
                entity.getName(),
                entity.getBio(),
                entity.getParentCategoryId() != null ? CategoryId.of(entity.getParentCategoryId()) : null
        );
    }
}
