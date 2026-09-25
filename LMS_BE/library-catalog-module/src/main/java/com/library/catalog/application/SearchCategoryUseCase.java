package com.library.catalog.application;

import com.library.catalog.dto.response.category.CategoryOverviewResponse;
import java.util.List;

public interface SearchCategoryUseCase {
    List<CategoryOverviewResponse> execute(String keyword);
}
