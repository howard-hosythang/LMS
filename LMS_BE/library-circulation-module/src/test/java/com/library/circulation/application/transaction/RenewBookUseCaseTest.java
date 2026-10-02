package com.library.circulation.application.transaction;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.library.catalog.infrastructure.persistence.entity.ItemEntity;
import com.library.catalog.infrastructure.persistence.repository.ItemJpaRepository;
import com.library.circulation.application.policy.CirculationPolicy;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.application.transaction.impl.RenewBookUseCaseImpl;
import com.library.circulation.domain.enums.PaymentStatus;
import com.library.circulation.domain.enums.ReservationStatus;
import com.library.circulation.domain.enums.TransactionStatus;
import com.library.circulation.dto.response.BorrowTransactionResponse;
import com.library.circulation.infrastructure.persistence.entity.BorrowingTransactionEntity;
import com.library.circulation.infrastructure.persistence.repository.BorrowingTransactionJpaRepository;
import com.library.circulation.infrastructure.persistence.repository.FineJpaRepository;
import com.library.circulation.infrastructure.persistence.repository.ReservationJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("RenewBookUseCase — Unit Tests")
class RenewBookUseCaseTest {

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
  private static final Long TRANSACTION_ID = 5001L;
  private static final Long USER_ID = 1001L;
  private static final Long ITEM_ID = 2001L;
  private static final Long PUBLICATION_ID = 3001L;

  @Mock private BorrowingTransactionJpaRepository transactionRepository;
  @Mock private ItemJpaRepository itemRepository;
  @Mock private ReservationJpaRepository reservationRepository;
  @Mock private FineJpaRepository fineRepository;
  @Mock private CirculationPolicyService policyService;
  @InjectMocks private RenewBookUseCaseImpl useCase;

  @BeforeEach
  void setUp() {
    when(policyService.getPolicy()).thenReturn(defaultPolicy());
  }

  @Test
  @DisplayName("Gia hạn thành công cộng dồn hạn cũ và tăng renewal count")
  void renewSuccess() {
    LocalDate oldDueDate = LocalDate.now(ZONE).plusDays(1);
    BorrowingTransactionEntity transaction = borrowingTransaction(oldDueDate, 0);
    when(transactionRepository.findById(TRANSACTION_ID)).thenReturn(Optional.of(transaction));
    when(itemRepository.findById(ITEM_ID)).thenReturn(Optional.of(item()));
    when(reservationRepository.countByPublicationIdAndStatus(PUBLICATION_ID, ReservationStatus.PENDING)).thenReturn(0L);
    when(fineRepository.existsByUserIdAndPaymentStatus(USER_ID, PaymentStatus.UNPAID)).thenReturn(false);
    when(transactionRepository.save(any(BorrowingTransactionEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

    BorrowTransactionResponse result = useCase.execute(TRANSACTION_ID, USER_ID, false);

    assertThat(result.getDueDate()).isEqualTo(oldDueDate.plusDays(14));
    assertThat(result.getRenewalCount()).isEqualTo(1);
    assertThat(result.getMaxRenewals()).isEqualTo(1);
    verify(transactionRepository).save(transaction);
  }

  @Test
  @DisplayName("Từ chối gia hạn khi có độc giả đang chờ đặt trước")
  void rejectsWhenPublicationHasPendingReservation() {
    when(transactionRepository.findById(TRANSACTION_ID)).thenReturn(Optional.of(
        borrowingTransaction(LocalDate.now(ZONE).plusDays(1), 0)));
    when(itemRepository.findById(ITEM_ID)).thenReturn(Optional.of(item()));
    when(reservationRepository.countByPublicationIdAndStatus(PUBLICATION_ID, ReservationStatus.PENDING)).thenReturn(1L);

    assertCannotRenew();
    verify(transactionRepository, never()).save(any());
  }

  @Test
  @DisplayName("Từ chối gia hạn khi đã dùng hết lượt")
  void rejectsWhenRenewalLimitReached() {
    when(transactionRepository.findById(TRANSACTION_ID)).thenReturn(Optional.of(
        borrowingTransaction(LocalDate.now(ZONE).plusDays(1), 1)));

    assertCannotRenew();
    verify(itemRepository, never()).findById(any());
  }

  @Test
  @DisplayName("Từ chối gia hạn khi chưa vào cửa sổ gia hạn")
  void rejectsWhenNotInRenewalWindow() {
    when(transactionRepository.findById(TRANSACTION_ID)).thenReturn(Optional.of(
        borrowingTransaction(LocalDate.now(ZONE).plusDays(3), 0)));

    assertCannotRenew();
    verify(itemRepository, never()).findById(any());
  }

  @Test
  @DisplayName("Từ chối gia hạn khi đã quá hạn")
  void rejectsWhenOverdue() {
    when(transactionRepository.findById(TRANSACTION_ID)).thenReturn(Optional.of(
        borrowingTransaction(LocalDate.now(ZONE).minusDays(1), 0)));

    assertCannotRenew();
    verify(itemRepository, never()).findById(any());
  }

  private void assertCannotRenew() {
    assertThatThrownBy(() -> useCase.execute(TRANSACTION_ID, USER_ID, false))
        .isInstanceOf(AppException.class)
        .satisfies(exception -> assertThat(((AppException) exception).getErrorCode())
            .isEqualTo(ErrorCode.CANNOT_RENEW_TRANSACTION));
  }

  private BorrowingTransactionEntity borrowingTransaction(LocalDate dueDate, int renewalCount) {
    BorrowingTransactionEntity transaction = BorrowingTransactionEntity.builder()
        .userId(USER_ID)
        .itemId(ITEM_ID)
        .dueDate(dueDate)
        .status(TransactionStatus.BORROWING)
        .renewalCount(renewalCount)
        .build();
    transaction.setId(TRANSACTION_ID);
    return transaction;
  }

  private ItemEntity item() {
    ItemEntity item = new ItemEntity();
    item.setId(ITEM_ID);
    item.setPublicationId(PUBLICATION_ID);
    item.setBarcode("BC001");
    item.setBranch("Cơ sở 1");
    item.setLocation("B4-301");
    return item;
  }

  private CirculationPolicy defaultPolicy() {
    return new CirculationPolicy(
        48, 14, 5, 2, new BigDecimal("1000"), true, null, null, Instant.now());
  }
}
