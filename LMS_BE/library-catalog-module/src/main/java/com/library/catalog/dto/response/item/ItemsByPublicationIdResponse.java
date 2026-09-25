package com.library.catalog.dto.response.item;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.library.catalog.domain.entities.ItemStatus;
import com.library.catalog.domain.enums.BindingType;
import com.library.catalog.domain.enums.ConditionItemEnum;
import com.library.catalog.domain.enums.CopyType;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
public class ItemsByPublicationIdResponse {

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
  private LocalDate dueDate;

  public ItemsByPublicationIdResponse(Long id, String barcode, String branch, String location,
      ItemStatus status, ConditionItemEnum condition, CopyType copyType, BindingType bindingType,
      String conditionNote, LocalDate acquiredDate, String acquisitionSource, LocalDate dueDate) {
    this.id = id;
    this.barcode = barcode;
    this.branch = branch;
    this.location = location;
    this.status = status;
    this.condition = condition;
    this.copyType = copyType;
    this.bindingType = bindingType;
    this.conditionNote = conditionNote;
    this.acquiredDate = acquiredDate;
    this.acquisitionSource = acquisitionSource;
    this.dueDate = dueDate;
  }

  public ItemsByPublicationIdResponse(Long id, String barcode, String branch, String location,
      ItemStatus status, ConditionItemEnum condition) {
    this.id = id;
    this.barcode = barcode;
    this.branch = branch;
    this.location = location;
    this.status = status;
    this.condition = condition;
    this.dueDate = null;
  }
}
