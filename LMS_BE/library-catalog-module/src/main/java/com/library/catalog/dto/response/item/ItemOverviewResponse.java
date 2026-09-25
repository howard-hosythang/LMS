package com.library.catalog.dto.response.item;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ItemOverviewResponse {
    private Integer totalItems;
    private Integer totalAvailableItems;
    private Integer totalBorrowedItems;
}
