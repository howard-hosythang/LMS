package com.library.catalog.application;

import com.library.catalog.dto.request.item.ItemSearchRequest;
import com.library.catalog.dto.response.item.ItemDetailResponse;
import com.library.shared.dto.PageResponse;

public interface GetListItemWithFilterUseCase {
    PageResponse<ItemDetailResponse> execute(ItemSearchRequest request);
}
