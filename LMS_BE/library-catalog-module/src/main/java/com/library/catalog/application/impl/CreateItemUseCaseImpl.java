package com.library.catalog.application.impl;

import com.library.catalog.application.CreateItemUseCase;
import com.library.catalog.domain.entities.ItemStatus;
import com.library.catalog.domain.enums.BindingType;
import com.library.catalog.domain.enums.CopyType;
import com.library.catalog.infrastructure.persistence.entity.ItemEntity;
import com.library.catalog.infrastructure.persistence.entity.PublicationEntity;
import com.library.catalog.infrastructure.persistence.repository.ItemJpaRepository;
import com.library.catalog.infrastructure.persistence.repository.PublicationJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.service.LibrarianNotificationService;
import com.library.shared.util.TsIdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CreateItemUseCaseImpl implements CreateItemUseCase {

    private final ItemJpaRepository itemJpaRepository;
    private final PublicationJpaRepository publicationJpaRepository;
    private final LibrarianNotificationService librarianNotificationService;

    @Override
    @Transactional
    public void execute(com.library.catalog.dto.request.item.CreateItemRequest request) {
        if (request.getPublicationId() == null) {
            throw new IllegalArgumentException("Publication ID is required");
        }
        if (request.getBarcode() == null || request.getBarcode().isBlank()) {
            throw new IllegalArgumentException("Barcode is required");
        }

        if (!publicationJpaRepository.existsById(request.getPublicationId())) {
            throw new AppException(ErrorCode.PUBLICATION_NOT_FOUND);
        }

        if (itemJpaRepository.existsByBarcode(request.getBarcode())) {
            throw new IllegalArgumentException("Barcode already exists: " + request.getBarcode());
        }

        ItemEntity entity = new ItemEntity();
        entity.setId(TsIdGenerator.next());
        entity.setPublicationId(request.getPublicationId());
        entity.setBarcode(request.getBarcode());
        entity.setBranch(request.getBranch());
        entity.setLocation(request.getLocation());
        entity.setCondition(request.getCondition());
        entity.setCopyType(request.getCopyType() != null ? request.getCopyType() : CopyType.ORIGINAL);
        entity.setBindingType(request.getBindingType() != null ? request.getBindingType() : BindingType.UNKNOWN);
        entity.setConditionNote(request.getConditionNote());
        entity.setAcquiredDate(request.getAcquiredDate());
        entity.setAcquisitionSource(request.getAcquisitionSource());
        entity.setStatus(ItemStatus.AVAILABLE);

        itemJpaRepository.save(entity);
        String publicationTitle = publicationJpaRepository.findById(request.getPublicationId())
            .map(PublicationEntity::getTitle)
            .orElse("Unknown publication");
        librarianNotificationService.notifyAll(
            "LIB_COPY_CREATED",
            "Đã thêm bản sao",
            String.format("Bản sao %s của '%s' đã được thêm tại %s - %s.",
                entity.getBarcode(), publicationTitle, entity.getBranch(), entity.getLocation()),
            "/librarianpage/copies/" + entity.getId(),
            entity.getId()
        );
    }
}
