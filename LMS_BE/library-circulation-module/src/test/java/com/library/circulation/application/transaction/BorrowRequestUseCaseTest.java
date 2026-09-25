package com.library.circulation.application.transaction;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.library.circulation.application.policy.CirculationPolicy;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.application.transaction.impl.BorrowRequestUseCaseImpl;
import com.library.circulation.dto.request.BorrowRequestCommand;
import com.library.circulation.dto.response.BorrowTransactionResponse;
import com.library.circulation.infrastructure.persistence.entity.BorrowingTransactionEntity;
import com.library.circulation.infrastructure.persistence.repository.BorrowingTransactionJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.port.ItemSnapshot;
import com.library.shared.port.ItemStatusPort;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;

@ExtendWith(MockitoExtension.class)
@DisplayName("BorrowRequestUseCase — Unit Tests")
class BorrowRequestUseCaseTest {

    @Mock private ItemStatusPort itemStatusPort;
    @Mock private BorrowingTransactionJpaRepository transactionJpaRepository;
    @Mock private NamedParameterJdbcTemplate jdbcTemplate;
    @Mock private KafkaTemplate<String, Object> kafkaTemplate;
    @Mock private CirculationPolicyService policyService;

    @InjectMocks private BorrowRequestUseCaseImpl useCase;

    private static final Long USER_ID = 1001L;
    private static final Long ITEM_ID = 2001L;
    private static final Long PUBLICATION_ID = 3001L;

    private ItemSnapshot availableItem;

    @BeforeEach
    void setUp() {
        // ItemSnapshot(id, status, publicationId, publicationTitle, barcode, branch, location)
        availableItem = new ItemSnapshot(
            ITEM_ID, "AVAILABLE", PUBLICATION_ID, "Clean Code",
            "BC001", "Cơ sở 1 - Lý Thường Kiệt", "B4-301"
        );
        when(policyService.getPolicy()).thenReturn(defaultPolicy());
    }

    private CirculationPolicy defaultPolicy() {
        return new CirculationPolicy(
            48,
            14,
            5,
            2,
            new BigDecimal("1000"),
            true,
            null,
            null,
            Instant.now()
        );
    }

    @Test
    @DisplayName("Mượn sách thành công khi item AVAILABLE và không có ràng buộc")
    void borrowSuccess_whenItemAvailable() {
        // Given
        when(itemStatusPort.lockAndGet(ITEM_ID)).thenReturn(availableItem);
        when(jdbcTemplate.queryForObject(anyString(), any(Map.class), eq(Long.class)))
            .thenReturn(0L)   // active borrows = 0
            .thenReturn(0L);  // unpaid fines = 0
        when(transactionJpaRepository.existsByUserIdAndPublicationId(USER_ID, PUBLICATION_ID))
            .thenReturn(false);
        when(transactionJpaRepository.save(any(BorrowingTransactionEntity.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        // When
        BorrowTransactionResponse result = useCase.execute(USER_ID, new BorrowRequestCommand(ITEM_ID));

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getPublicationTitle()).isEqualTo("Clean Code");
        assertThat(result.getBarcode()).isEqualTo("BC001");
        verify(itemStatusPort).updateStatus(ITEM_ID, "RESERVED");
        verify(transactionJpaRepository).save(any());
    }

    @Test
    @DisplayName("Ném ITEM_NOT_BORROWABLE khi item không ở trạng thái AVAILABLE")
    void throwException_whenItemNotAvailable() {
        // Given — item đang BORROWED
        ItemSnapshot borrowedItem = new ItemSnapshot(
            ITEM_ID, "BORROWED", PUBLICATION_ID, "Clean Code",
            "BC001", "Cơ sở 1 - Lý Thường Kiệt", "B4-301"
        );
        when(itemStatusPort.lockAndGet(ITEM_ID)).thenReturn(borrowedItem);

        // When & Then
        assertThatThrownBy(() -> useCase.execute(USER_ID, new BorrowRequestCommand(ITEM_ID)))
            .isInstanceOf(AppException.class)
            .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.ITEM_NOT_BORROWABLE));

        verify(itemStatusPort, never()).updateStatus(anyLong(), anyString());
        verify(transactionJpaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ném USER_HAS_UNPAID_FINES khi user còn nợ phí phạt")
    void throwException_whenUserHasUnpaidFines() {
        // Given
        when(itemStatusPort.lockAndGet(ITEM_ID)).thenReturn(availableItem);
        when(jdbcTemplate.queryForObject(anyString(), any(Map.class), eq(Long.class)))
            .thenReturn(0L)   // active borrows = 0 (pass)
            .thenReturn(2L);  // unpaid fines = 2 (fail)

        // When & Then
        assertThatThrownBy(() -> useCase.execute(USER_ID, new BorrowRequestCommand(ITEM_ID)))
            .isInstanceOf(AppException.class)
            .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.USER_HAS_UNPAID_FINES));

        verify(itemStatusPort, never()).updateStatus(anyLong(), anyString());
    }

    @Test
    @DisplayName("Ném USER_BORROW_LIMIT_EXCEEDED khi user đã mượn đủ 5 cuốn")
    void throwException_whenBorrowLimitExceeded() {
        // Given
        when(itemStatusPort.lockAndGet(ITEM_ID)).thenReturn(availableItem);
        when(jdbcTemplate.queryForObject(anyString(), any(Map.class), eq(Long.class)))
            .thenReturn(5L);  // active borrows = 5 (vượt giới hạn)

        // When & Then
        assertThatThrownBy(() -> useCase.execute(USER_ID, new BorrowRequestCommand(ITEM_ID)))
            .isInstanceOf(AppException.class)
            .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.USER_BORROW_LIMIT_EXCEEDED));
    }
}
