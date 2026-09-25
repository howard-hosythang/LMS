package com.library.catalog.application.impl;

import com.library.catalog.application.SearchCategoryUseCase;
import com.library.catalog.dto.response.category.CategoryOverviewResponse;
import com.library.catalog.infrastructure.persistence.repository.CategoryJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchCategoryUseCaseImpl implements SearchCategoryUseCase {

    private final CategoryJpaRepository categoryJpaRepository;

    @Override
    public List<CategoryOverviewResponse> execute(String keyword) {
        return categoryJpaRepository.searchByName(keyword, PageRequest.of(0, 10))
                .stream()
                .map(entity -> CategoryOverviewResponse.builder()
                        .id(entity.getId())
                        .name(entity.getName())
                        .build())
                .toList();
    }
}
