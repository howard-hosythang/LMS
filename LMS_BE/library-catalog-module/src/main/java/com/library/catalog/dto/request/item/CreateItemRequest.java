package com.library.catalog.dto.request.item;

import com.library.catalog.domain.enums.BindingType;
import com.library.catalog.domain.enums.ConditionItemEnum;
import com.library.catalog.domain.enums.CopyType;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CreateItemRequest {
    private Long publicationId;
    private String barcode;
    private String branch;
    private String location;
    private ConditionItemEnum condition;
    private CopyType copyType;
    private BindingType bindingType;
    private String conditionNote;
    private LocalDate acquiredDate;
    private String acquisitionSource;
}
