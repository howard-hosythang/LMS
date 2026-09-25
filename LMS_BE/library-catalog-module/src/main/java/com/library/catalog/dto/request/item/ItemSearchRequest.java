package com.library.catalog.dto.request.item;

import com.library.catalog.domain.entities.ItemStatus;
import com.library.catalog.domain.enums.ConditionItemEnum;
import lombok.Data;

@Data
public class ItemSearchRequest {
    private int page = 0;
    private int size = 20;
    private String keyword;
    private ItemStatus status;
    private ConditionItemEnum condition;
    private String sortBy = "createdAt";
    private String sortDir = "DESC";
}
