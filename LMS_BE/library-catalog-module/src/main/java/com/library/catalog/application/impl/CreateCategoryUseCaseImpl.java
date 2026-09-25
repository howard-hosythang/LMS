package com.library.catalog.application.impl;

import com.library.catalog.application.CreateCategoryUseCase;
import com.library.catalog.infrastructure.persistence.entity.CategoryEntity;
import com.library.catalog.infrastructure.persistence.repository.CategoryJpaRepository;
import com.library.shared.util.TsIdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CreateCategoryUseCaseImpl implements CreateCategoryUseCase {

    private final CategoryJpaRepository categoryJpaRepository;

    @Override
    @Transactional
    public Long execute(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Category name cannot be empty");
        }
        CategoryEntity entity = new CategoryEntity();
        entity.setId(TsIdGenerator.next());
        entity.setName(name.replace("\"", ""));
        categoryJpaRepository.save(entity);
        return entity.getId();
    }
}
