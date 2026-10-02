package com.library.circulation.application.transaction.impl;

import com.library.catalog.infrastructure.persistence.entity.ItemEntity;
import com.library.catalog.infrastructure.persistence.repository.ItemJpaRepository;
import com.library.circulation.application.policy.CirculationPolicy;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.application.transaction.RenewBookUseCase;
import com.library.circulation.application.transaction.RenewalRules;
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
import java.time.LocalDate;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RenewBookUseCaseImpl implements RenewBookUseCase {

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

  private final BorrowingTransactionJpaRepository transactionRepository;
  private final ItemJpaRepository itemRepository;
  private final ReservationJpaRepository reservationRepository;
  private final FineJpaRepository fineRepository;
  private final CirculationPolicyService policyService;

  @Override
  @Transactional
  public BorrowTransactionResponse execute(Long transactionId, Long actorUserId, boolean isLibrarian) {
    BorrowingTransactionEntity transaction = transactionRepository.findById(transactionId)
        .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

    if (!isLibrarian && !transaction.getUserId().equals(actorUserId)) {
      throw new AppException(ErrorCode.NOT_OWNER);
    }

    CirculationPolicy policy = policyService.getPolicy();
    LocalDate today = LocalDate.now(ZONE);
    ErrorCode failure = RenewalRules.basicFailure(transaction.getStatus(), transaction.getDueDate(),
        transaction.getRenewalCount(), policy, today);
    if (failure != null) throw new AppException(failure);

    ItemEntity item = itemRepository.findById(transaction.getItemId())
        .orElseThrow(() -> new AppException(ErrorCode.ITEM_NOT_FOUND));
    // PENDING is the persisted equivalent of WAITING_FOR_BOOK in this LMS schema.
    if (reservationRepository.countByPublicationIdAndStatus(
        item.getPublicationId(), ReservationStatus.PENDING) > 0) {
      throw new AppException(ErrorCode.RENEWAL_HAS_RESERVATIONS);
    }

    if (fineRepository.existsByUserIdAndPaymentStatus(transaction.getUserId(), PaymentStatus.UNPAID)) {
      throw new AppException(ErrorCode.RENEWAL_UNPAID_FINES);
    }

    transaction.setDueDate(transaction.getDueDate().plusDays(policy.defaultLoanDays()));
    transaction.setRenewalCount(transaction.getRenewalCount() + 1);
    transactionRepository.save(transaction);

    return BorrowTransactionResponse.builder()
        .transactionId(transaction.getId())
        .itemId(item.getId())
        .barcode(item.getBarcode())
        .publicationId(item.getPublicationId())
        .branch(item.getBranch())
        .location(item.getLocation())
        .dueDate(transaction.getDueDate())
        .status(transaction.getStatus())
        .renewalCount(transaction.getRenewalCount())
        .maxRenewals(policy.maxRenewals())
        .build();
  }
}
