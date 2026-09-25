package com.library.catalog.presentation.controller;

import com.library.catalog.application.CreateCategoryUseCase;
import com.library.catalog.application.GetAllCategoryUseCase;
import com.library.catalog.application.SearchCategoryUseCase;
import com.library.catalog.dto.response.category.CategoryOverviewResponse;
import com.library.shared.constant.RoleConstants;
import com.library.shared.dto.ApiResponseApp;
import com.library.shared.util.RequiresRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final GetAllCategoryUseCase getAllCategoryUseCase;
    private final SearchCategoryUseCase searchCategoryUseCase;
    private final CreateCategoryUseCase createCategoryUseCase;

    // limit 10
    @RequiresRole(RoleConstants.LIBRARIAN)
    @GetMapping("/search")
    public ApiResponseApp<List<CategoryOverviewResponse>> searchCategories(@RequestParam("keyword") String keyword) {
        log.info("Search categories with keyword: {}", keyword);
        return ApiResponseApp.success(searchCategoryUseCase.execute(keyword));
    }


    @GetMapping
    public ApiResponseApp<List<CategoryOverviewResponse>> getAllCategory(
        @RequestHeader(name = "Accept-Language", required = false) String acceptLanguage) {
        return ApiResponseApp.success(getAllCategoryUseCase.execute(acceptLanguage));
    }

    @PostMapping
    @RequiresRole(RoleConstants.LIBRARIAN)
    public ApiResponseApp<Map<String, Object>> createCategory(@RequestBody String name) {
        log.info("Create category: {}", name);
        Long id = createCategoryUseCase.execute(name);
        return ApiResponseApp.created(Map.of("id", String.valueOf(id), "name", name.replace("\"", "")));
    }
}
