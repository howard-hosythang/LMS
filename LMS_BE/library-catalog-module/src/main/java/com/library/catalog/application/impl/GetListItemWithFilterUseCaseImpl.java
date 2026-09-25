package com.library.catalog.application.impl;

import com.library.catalog.application.GetListItemWithFilterUseCase;
import com.library.catalog.dto.request.item.ItemSearchRequest;
import com.library.catalog.dto.response.item.ItemDetailResponse;
import com.library.catalog.infrastructure.persistence.repository.ItemRepositoryCustom;
import com.library.shared.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetListItemWithFilterUseCaseImpl implements GetListItemWithFilterUseCase {

    private final ItemRepositoryCustom itemRepositoryCustom;

    @Override
    public PageResponse<ItemDetailResponse> execute(ItemSearchRequest request) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(request.getSortDir()) ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(
                request.getPage(),
                request.getSize(),
                Sort.by(direction, request.getSortBy())
        );

        Page<ItemDetailResponse> items = itemRepositoryCustom.findAllItemWithFilter(request, pageable);

        return PageResponse.from(items);
    }
}
