package com.library.catalog.application;

import com.library.catalog.dto.response.item.ItemDetailResponse;

public interface GetItemByIdUseCase {
    ItemDetailResponse execute(Long id);
}
