package com.library.catalog.application.impl;

import com.library.catalog.application.GetItemByIdUseCase;
import com.library.catalog.application.GetPublicationByIdByUseCase;
import com.library.catalog.dto.response.item.ItemDetailResponse;
import com.library.catalog.dto.response.publication.PublicationDetailResponse;
import com.library.catalog.infrastructure.persistence.entity.ItemEntity;
import com.library.catalog.infrastructure.persistence.repository.ItemJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetItemByIdUseCaseImpl implements GetItemByIdUseCase {

  private final ItemJpaRepository itemJpaRepository;
  private final GetPublicationByIdByUseCase getPublicationByIdByUseCase;

  @Override
  public ItemDetailResponse execute(Long id) {
    ItemEntity item = itemJpaRepository.findById(id)
        .orElseThrow(() -> new AppException(ErrorCode.ITEM_NOT_FOUND));

    PublicationDetailResponse publication = getPublicationByIdByUseCase.execute(
        item.getPublicationId());

    return ItemDetailResponse.builder()
        .id(item.getId())
        .barcode(item.getBarcode())
        .branch(item.getBranch())
        .location(item.getLocation())
        .status(item.getStatus())
        .condition(item.getCondition())
        .copyType(item.getCopyType())
        .bindingType(item.getBindingType())
        .conditionNote(item.getConditionNote())
        .acquiredDate(item.getAcquiredDate())
        .acquisitionSource(item.getAcquisitionSource())
        .publicationTitle(publication.getPublication().getTitle())
        .publication(publication)
        .build();
  }
}
