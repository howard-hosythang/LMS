package com.library.catalog.infrastructure.persistence.mapper;

import com.library.catalog.domain.entities.Category;
import com.library.catalog.infrastructure.persistence.entity.CategoryEntity;

public interface CategoryEntityMapper {
    Category toDomain(CategoryEntity entity);

}
