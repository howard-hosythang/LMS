package com.library.catalog.domain.repository;

import com.library.catalog.domain.entities.Category;

import java.util.List;

public interface CategoryRepository {
    List<Category> findAll();
}
