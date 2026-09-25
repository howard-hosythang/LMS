package com.library.catalog.application;

import com.library.catalog.dto.response.category.CategoryOverviewResponse;

import java.util.List;

public interface GetAllCategoryUseCase {
    default List<CategoryOverviewResponse> execute() {
        return execute("vi");
    }

    List<CategoryOverviewResponse> execute(String uiLanguage);
}
