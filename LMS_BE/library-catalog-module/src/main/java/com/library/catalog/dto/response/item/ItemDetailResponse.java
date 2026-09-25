package com.library.catalog.dto.response.item;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.library.catalog.domain.entities.ItemStatus;
import com.library.catalog.domain.enums.BindingType;
import com.library.catalog.domain.enums.ConditionItemEnum;
import com.library.catalog.domain.enums.CopyType;
import com.library.catalog.dto.response.publication.PublicationDetailResponse;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ItemDetailResponse {

  @JsonSerialize(using = ToStringSerializer.class)
  private Long id;
  private String barcode;
  private String branch;
  private String location;
  private ItemStatus status;
  private ConditionItemEnum condition;
  private CopyType copyType;
  private BindingType bindingType;
  private String conditionNote;
  private LocalDate acquiredDate;
  private String acquisitionSource;
  private String publicationTitle;
  private PublicationDetailResponse publication;
}
