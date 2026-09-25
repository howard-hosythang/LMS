package com.library.circulation.application.transaction;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.library.circulation.application.deposit.BorrowDepositService;
import com.library.circulation.application.policy.CirculationPolicy;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.application.transaction.impl.ReturnBookUseCaseImpl;
import com.library.circulation.application.credit.ReaderCreditScoreService;
import com.library.circulation.domain.enums.TransactionStatus;
import com.library.circulation.dto.request.ReturnCommand;
import com.library.circulation.dto.response.ReturnResponse;
import com.library.circulation.infrastructure.persistence.entity.BorrowingTransactionEntity;
import com.library.circulation.infrastructure.persistence.entity.FineEntity;
import com.library.circulation.infrastructure.persistence.repository.BorrowingTransactionJpaRepository;
import com.library.circulation.infrastructure.persistence.repository.FineJpaRepository;
import com.library.circulation.infrastructure.service.ReservationAssignmentService;
import com.library.circulation.infrastructure.service.WishlistAvailabilityNotificationService;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.service.LibrarianNotificationService;
import com.library.shared.port.ItemSnapshot;
import com.library.shared.port.ItemStatusPort;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
@DisplayName("ReturnBookUseCase — Unit Tests")
class ReturnBookUseCaseTest {

    @Mock private ItemStatusPort itemStatusPort;
    @Mock private BorrowingTransactionJpaRepository transactionJpaRepository;
    @Mock private FineJpaRepository fineJpaRepository;
    @Mock private NamedParameterJdbcTemplate jdbcTemplate;
    @Mock private KafkaTemplate<String, Object> kafkaTemplate;
    @Mock private ReservationAssignmentService reservationAssignmentService;
    @Mock private CirculationPolicyService policyService;
    @Mock private BorrowDepositService borrowDepositService;
    @Mock private LibrarianNotificationService librarianNotificationService;
    @Mock private ReaderCreditScoreService readerCreditScoreService;
    @Mock private WishlistAvailabilityNotificationService wishlistAvailabilityNotificationService;

    @InjectMocks private ReturnBookUseCaseImpl useCase;

    private static final Long LIBRARIAN_ID = 999L;
    private static final Long ITEM_ID = 2001L;
    private static final Long TRANSACTION_ID = 5001L;
    private static final Long USER_ID = 1001L;
    private static final Long PUBLICATION_ID = 3001L;
    private static final String BARCODE = "BC001";
    private static final String BRANCH = "Cơ sở 1 - Lý Thường Kiệt";

    private ItemSnapshot item;

    @BeforeEach
    void setUp() {
        // ItemSnapshot(id, status, publicationId, publicationTitle, barcode, branch, location)
        item = new ItemSnapshot(ITEM_ID, "BORROWED", PUBLICATION_ID, "Clean Code", BARCODE, BRANCH, "B4-301");
    }

    private BorrowingTransactionEntity buildEntity(LocalDate dueDate) {
        BorrowingTransactionEntity e = BorrowingTransactionEntity.builder()
            .userId(USER_ID)
            .itemId(ITEM_ID)
            .borrowedDate(Instant.now().minusSeconds(86400 * 10))
            .dueDate(dueDate)
            .status(TransactionStatus.BORROWING)
            .renewalCount(0)
            .build();
        e.setId(TRANSACTION_ID);
        return e;
    }

    @Test
    @DisplayName("Trả sách thành công không phát sinh phí phạt khi còn trong hạn")
    void returnSuccess_noFine() {
        // Given — dueDate là ngày mai
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        when(itemStatusPort.lockAndGetByBarcode(BARCODE)).thenReturn(item);
        when(jdbcTemplate.queryForList(anyString(), any(Map.class)))
            .thenReturn(List.of(Map.of("id", TRANSACTION_ID)));
        when(transactionJpaRepository.findById(TRANSACTION_ID))
            .thenReturn(Optional.of(buildEntity(tomorrow)));
        when(transactionJpaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(borrowDepositService.settleOnReturn(TRANSACTION_ID, LIBRARIAN_ID))
            .thenReturn(noDepositSettlement());
        when(wishlistAvailabilityNotificationService.isOutOfStock(PUBLICATION_ID)).thenReturn(false);

        // When
        ReturnResponse result = useCase.execute(LIBRARIAN_ID, new ReturnCommand(BARCODE));

        // Then
        assertThat(result.overdue()).isFalse();
        assertThat(result.overdueFineAmount()).isNull();
        assertThat(result.publicationTitle()).isEqualTo("Clean Code");
        verify(fineJpaRepository, never()).save(any(FineEntity.class));
        verify(itemStatusPort).updateStatus(ITEM_ID, "AVAILABLE");
    }

    @Test
    @DisplayName("Trả sách trễ 3 ngày → phát sinh phí phạt 3.000đ")
    void returnSuccess_withOverdueFine_3Days() {
        // Given — dueDate là 3 ngày trước
        LocalDate threeDaysAgo = LocalDate.now().minusDays(3);
        when(itemStatusPort.lockAndGetByBarcode(BARCODE)).thenReturn(item);
        when(jdbcTemplate.queryForList(anyString(), any(Map.class)))
            .thenReturn(List.of(Map.of("id", TRANSACTION_ID)));
        when(transactionJpaRepository.findById(TRANSACTION_ID))
            .thenReturn(Optional.of(buildEntity(threeDaysAgo)));
        when(transactionJpaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(fineJpaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(borrowDepositService.settleOnReturn(TRANSACTION_ID, LIBRARIAN_ID))
            .thenReturn(noDepositSettlement());
        when(wishlistAvailabilityNotificationService.isOutOfStock(PUBLICATION_ID)).thenReturn(false);
        when(policyService.getPolicy()).thenReturn(new CirculationPolicy(
            48,
            14,
            5,
            2,
            new BigDecimal("1000"),
            true,
            null,
            null,
            Instant.now()
        ));

        // When
        ReturnResponse result = useCase.execute(LIBRARIAN_ID, new ReturnCommand(BARCODE));

        // Then
        assertThat(result.overdue()).isTrue();
        assertThat(result.overdueFineAmount())
            .isEqualByComparingTo(new BigDecimal("3000")); // 3 ngày × 1000đ
        verify(fineJpaRepository).save(any(FineEntity.class));
    }

    private BorrowDepositService.DepositSettlement noDepositSettlement() {
        return BorrowDepositService.DepositSettlement.builder()
            .depositAmount(BigDecimal.ZERO)
            .depositStatus("NOT_REQUIRED")
            .grossFineAmount(BigDecimal.ZERO)
            .depositAppliedAmount(BigDecimal.ZERO)
            .depositRefundAmount(BigDecimal.ZERO)
            .additionalAmountDue(BigDecimal.ZERO)
            .build();
    }

    @Test
    @DisplayName("Ném TRANSACTION_NOT_FOUND khi không có giao dịch đang mượn")
    void throwException_whenTransactionNotFound() {
        // Given — không có active transaction
        when(itemStatusPort.lockAndGetByBarcode(BARCODE)).thenReturn(item);
        when(jdbcTemplate.queryForList(anyString(), any(Map.class)))
            .thenReturn(List.of()); // empty

        // When & Then
        assertThatThrownBy(() -> useCase.execute(LIBRARIAN_ID, new ReturnCommand(BARCODE)))
            .isInstanceOf(AppException.class)
            .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.TRANSACTION_NOT_FOUND));

        verify(transactionJpaRepository, never()).save(any());
    }
}
