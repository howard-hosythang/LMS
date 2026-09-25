package com.library.catalog.infrastructure.persistence.entity;

import com.library.catalog.domain.entities.ItemStatus;
import com.library.catalog.domain.enums.BindingType;
import com.library.catalog.domain.enums.ConditionItemEnum;
import com.library.catalog.domain.enums.CopyType;
import com.library.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@Table(name = "items", indexes = {
    @Index(name = "idx_item_publication_id", columnList = "publicationId")
})
@Getter
@Setter
@AllArgsConstructor
public class ItemEntity extends BaseEntity {

  @Column(name = "publication_id", nullable = false)
  private Long publicationId;

  @Column(nullable = false, unique = true, length = 50)
  private String barcode;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private ItemStatus status;

  @Column(length = 100)
  private String branch;

  @Column(name = "location", length = 100)
  private String location;

  @Enumerated(EnumType.STRING)
  @Column(length = 20)
  private ConditionItemEnum condition;

  @Enumerated(EnumType.STRING)
  @Column(name = "copy_type", length = 40)
  private CopyType copyType;

  @Enumerated(EnumType.STRING)
  @Column(name = "binding_type", length = 40)
  private BindingType bindingType;

  @Column(name = "condition_note", columnDefinition = "TEXT")
  private String conditionNote;

  @Column(name = "acquired_date")
  private LocalDate acquiredDate;

  @Column(name = "acquisition_source", length = 120)
  private String acquisitionSource;

  public ItemEntity() {
  }
}
