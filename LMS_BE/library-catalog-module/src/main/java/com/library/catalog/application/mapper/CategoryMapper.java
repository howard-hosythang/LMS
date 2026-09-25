package com.library.catalog.application.mapper;

import com.library.catalog.domain.entities.Category;
import com.library.catalog.dto.response.category.CategoryOverviewResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    @Mapping(target = "id", source = "id.value")
    @Mapping(target = "bio", ignore = true)
    @Mapping(target = "parentCategoryId", ignore = true)
    @Mapping(target = "parentCategoryName", ignore = true)
    @Mapping(target = "publicationCount", ignore = true)
    CategoryOverviewResponse toCategoryOverviewResponse(Category category);
}
