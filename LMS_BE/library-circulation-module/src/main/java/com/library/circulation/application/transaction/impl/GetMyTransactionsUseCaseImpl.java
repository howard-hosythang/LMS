package com.library.circulation.application.transaction.impl;

import com.library.circulation.application.transaction.GetMyTransactionsUseCase;
import com.library.circulation.application.policy.CirculationPolicy;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.domain.enums.PaymentStatus;
import com.library.circulation.domain.enums.ReservationStatus;
import com.library.circulation.domain.enums.TransactionStatus;
import com.library.circulation.dto.response.UserTransactionResponse;
import com.library.circulation.infrastructure.persistence.repository.BorrowingTransactionJpaRepository;
import com.library.circulation.infrastructure.persistence.repository.FineJpaRepository;
import com.library.circulation.infrastructure.persistence.repository.ReservationJpaRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetMyTransactionsUseCaseImpl implements GetMyTransactionsUseCase {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final BorrowingTransactionJpaRepository jpaRepository;
    private final CirculationPolicyService policyService;
    private final ReservationJpaRepository reservationRepository;
    private final FineJpaRepository fineRepository;

    @Override
    public com.library.shared.dto.PageResponse<UserTransactionResponse> execute(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserTransactionResponse> result = jpaRepository.getMyTransactions(userId, pageable);
        CirculationPolicy policy = policyService.getPolicy();
        boolean hasUnpaidFines = fineRepository.existsByUserIdAndPaymentStatus(userId, PaymentStatus.UNPAID);
        LocalDate today = LocalDate.now(ZONE);
        result.forEach(transaction -> applyRenewalEligibility(transaction, policy, today, hasUnpaidFines));
        return com.library.shared.dto.PageResponse.from(result);
    }

    private void applyRenewalEligibility(
        UserTransactionResponse transaction,
        CirculationPolicy policy,
        LocalDate today,
        boolean hasUnpaidFines) {
        transaction.setMaxRenewals(policy.maxRenewals());
        transaction.setCanRenew(false);
        transaction.setCannotRenewReason(null);

        if (transaction.getStatus() != TransactionStatus.BORROWING) {
            transaction.setCannotRenewReason("NOT_BORROWING");
        } else if (transaction.getDueDate() == null || today.isAfter(transaction.getDueDate())) {
            transaction.setCannotRenewReason("OVERDUE");
        } else if (reservationRepository.countByPublicationIdAndStatus(
            transaction.getPublicationId(), ReservationStatus.PENDING) > 0) {
            // Keep this message visible even when another renewal rule would also block the action.
            transaction.setCannotRenewReason("HAS_RESERVATIONS");
        } else if (transaction.getRenewalCount() >= policy.maxRenewals()) {
            transaction.setCannotRenewReason("RENEWAL_LIMIT_REACHED");
        } else if (today.isBefore(transaction.getDueDate().minusDays(policy.renewalWindowDays()))) {
            transaction.setCannotRenewReason("NOT_IN_WINDOW");
        } else if (hasUnpaidFines) {
            transaction.setCannotRenewReason("UNPAID_FINES");
        } else {
            transaction.setCanRenew(true);
        }
    }
}
