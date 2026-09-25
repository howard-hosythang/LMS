package com.library.catalog.infrastructure.persistence.repository;

import com.library.catalog.dto.request.item.ItemSearchRequest;
import com.library.catalog.dto.response.item.ItemDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ItemRepositoryCustom {
    Page<ItemDetailResponse> findAllItemWithFilter(ItemSearchRequest request, Pageable pageable);
}
