package com.library.catalog.application.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.library.catalog.domain.entities.ItemStatus;
import com.library.catalog.domain.enums.ConditionItemEnum;
import com.library.catalog.dto.request.item.CreateItemRequest;
import com.library.catalog.infrastructure.persistence.entity.ItemEntity;
import com.library.catalog.infrastructure.persistence.entity.PublicationEntity;
import com.library.catalog.infrastructure.persistence.repository.ItemJpaRepository;
import com.library.catalog.infrastructure.persistence.repository.PublicationJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.service.LibrarianNotificationService;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("CreateItemUseCase — Unit Tests")
class CreateItemUseCaseImplTest {

    @Mock private ItemJpaRepository itemJpaRepository;
    @Mock private PublicationJpaRepository publicationJpaRepository;
    @Mock private LibrarianNotificationService librarianNotificationService;

    @InjectMocks private CreateItemUseCaseImpl useCase;

    @Test
    @DisplayName("creates AVAILABLE item when publication exists and barcode is unique")
    void execute_shouldCreateAvailableItem() {
        CreateItemRequest request = CreateItemRequest.builder()
            .publicationId(100L)
            .barcode("BC-001")
            .branch("Cơ sở 1 - Lý Thường Kiệt")
            .location("A1-201")
            .condition(ConditionItemEnum.NEW)
            .build();
        when(publicationJpaRepository.existsById(100L)).thenReturn(true);
        PublicationEntity publication = new PublicationEntity();
        publication.setTitle("Clean Code");
        when(publicationJpaRepository.findById(100L)).thenReturn(Optional.of(publication));
        when(itemJpaRepository.existsByBarcode("BC-001")).thenReturn(false);

        useCase.execute(request);

        ArgumentCaptor<ItemEntity> itemCaptor = ArgumentCaptor.forClass(ItemEntity.class);
        verify(itemJpaRepository).save(itemCaptor.capture());
        ItemEntity saved = itemCaptor.getValue();

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getPublicationId()).isEqualTo(100L);
        assertThat(saved.getBarcode()).isEqualTo("BC-001");
        assertThat(saved.getStatus()).isEqualTo(ItemStatus.AVAILABLE);
        assertThat(saved.getCondition()).isEqualTo(ConditionItemEnum.NEW);
    }

    @Test
    @DisplayName("throws PUBLICATION_NOT_FOUND when publication does not exist")
    void execute_shouldThrowWhenPublicationMissing() {
        CreateItemRequest request = CreateItemRequest.builder()
            .publicationId(404L)
            .barcode("BC-404")
            .build();
        when(publicationJpaRepository.existsById(404L)).thenReturn(false);

        assertThatThrownBy(() -> useCase.execute(request))
            .isInstanceOf(AppException.class)
            .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.PUBLICATION_NOT_FOUND));

        verify(itemJpaRepository, never()).save(any());
    }

    @Test
    @DisplayName("rejects duplicate barcode before saving")
    void execute_shouldRejectDuplicateBarcode() {
        CreateItemRequest request = CreateItemRequest.builder()
            .publicationId(100L)
            .barcode("BC-001")
            .build();
        when(publicationJpaRepository.existsById(100L)).thenReturn(true);
        when(itemJpaRepository.existsByBarcode("BC-001")).thenReturn(true);

        assertThatThrownBy(() -> useCase.execute(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Barcode already exists");

        verify(itemJpaRepository, never()).save(any());
    }
}
