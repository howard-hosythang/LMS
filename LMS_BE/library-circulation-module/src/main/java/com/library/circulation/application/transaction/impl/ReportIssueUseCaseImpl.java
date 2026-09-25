package com.library.circulation.application.transaction.impl;

import com.library.catalog.domain.valueobject.ItemId;
import com.library.circulation.application.credit.ReaderCreditScoreService;
import com.library.circulation.application.deposit.BorrowDepositService;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.application.transaction.ReportIssueUseCase;
import com.library.circulation.domain.entities.BorrowingTransaction;
import com.library.circulation.domain.valueobject.TransactionId;
import com.library.circulation.dto.request.ReportIssueCommand;
import com.library.circulation.dto.response.ReportIssueResponse;
import com.library.circulation.dto.response.ReportIssueResponse.FineDetail;
import com.library.circulation.infrastructure.persistence.entity.BorrowingTransactionEntity;
import com.library.circulation.infrastructure.persistence.entity.FineEntity;
import com.library.circulation.infrastructure.persistence.repository.BorrowingTransactionJpaRepository;
import com.library.circulation.infrastructure.persistence.repository.FineJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.LibraryEmailMessage;
import com.library.shared.kafka.event.NotificationMessage;
import com.library.shared.util.TsIdGenerator;
import com.library.user.domain.enums.ViolationType;
import com.library.user.domain.valueobject.UserId;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportIssueUseCaseImpl implements ReportIssueUseCase {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter RETURN_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private final com.library.shared.port.ItemStatusPort itemStatusPort;
    private final BorrowingTransactionJpaRepository transactionJpaRepository;
    private final FineJpaRepository fineJpaRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final CirculationPolicyService policyService;
    private final BorrowDepositService borrowDepositService;
    private final ReaderCreditScoreService readerCreditScoreService;

    @Override
    @Transactional
    public ReportIssueResponse execute(Long transactionId, Long librarianId, ReportIssueCommand command) {
        // Only DAMAGED_BOOK and LOST_BOOK are valid; OVERDUE_RETURN is auto-calculated
        if (command.type() == ViolationType.OVERDUE_RETURN) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // 1. Load transaction
        BorrowingTransactionEntity entity = transactionJpaRepository.findById(transactionId)
            .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        // 2. Lock item
        com.library.shared.port.ItemSnapshot item = itemStatusPort.lockAndGet(entity.getItemId());

        // 3. Domain: processReturn
        BorrowingTransaction transaction = toDomain(entity);
        transaction.processReturn(UserId.of(librarianId), Instant.now());

        // 4. Item status: DAMAGED → IN_MAINTENANCE, LOST → LOST
        String newItemStatus = command.type() == ViolationType.LOST_BOOK ? "LOST" : "IN_MAINTENANCE";
        itemStatusPort.updateStatus(item.id(), newItemStatus);

        // 5. Persist transaction
        applyToEntity(transaction, entity);
        transactionJpaRepository.save(entity);

        // 6. Create fines
        List<FineDetail> finesCreated = new ArrayList<>();
        LocalDate today = LocalDate.now(ZONE);

        // Fine for damage/loss (manual amount)
        FineEntity issueFine = FineEntity.builder()
            .transactionId(transactionId)
            .fineAmount(command.fineAmount())
            .type(command.type())
            .build();
        issueFine.setId(TsIdGenerator.next());
        fineJpaRepository.save(issueFine);
        finesCreated.add(FineDetail.builder()
            .fineId(issueFine.getId())
            .type(command.type())
            .amount(command.fineAmount())
            .build());

        // Additional overdue fine if also past due date
        if (transaction.isOverdue(today)) {
            long daysLate = ChronoUnit.DAYS.between(transaction.getDueDate(), today);
            BigDecimal overdueFineAmount = policyService.getPolicy().overdueFinePerDay()
                .multiply(BigDecimal.valueOf(daysLate));
            FineEntity overdueFine = FineEntity.builder()
                .transactionId(transactionId)
                .fineAmount(overdueFineAmount)
                .type(ViolationType.OVERDUE_RETURN)
                .build();
            overdueFine.setId(TsIdGenerator.next());
            fineJpaRepository.save(overdueFine);
            finesCreated.add(FineDetail.builder()
                .fineId(overdueFine.getId())
                .type(ViolationType.OVERDUE_RETURN)
                .amount(overdueFineAmount)
                .build());
            log.info("Additional overdue fine created: transactionId={}, daysLate={}", transactionId, daysLate);
        }
        transactionJpaRepository.flush();
        fineJpaRepository.flush();
        BorrowDepositService.DepositSettlement depositSettlement =
            borrowDepositService.settleOnReturn(transactionId, librarianId);
        readerCreditScoreService.recordBookIssue(entity.getUserId(), command.type());
        if (transaction.isOverdue(today)) {
            long daysLate = ChronoUnit.DAYS.between(transaction.getDueDate(), today);
            readerCreditScoreService.recordReturn(entity.getUserId(), daysLate);
        }

        // 7. Notify FINE_ISSUED (referenceId = first fine id)
        kafkaTemplate.send(KafkaTopics.NOTIFICATION_SEND, new NotificationMessage(
            entity.getUserId(),
            "FINE_ISSUED",
            "Thông báo phí phạt",
            String.format("Sách '%s' đã được ghi nhận %s. Phạt gốc %sđ, đã khấu trừ cọc %sđ, còn cần đóng thêm %sđ.",
                item.publicationTitle(),
                command.type() == ViolationType.LOST_BOOK ? "mất/thất lạc" : "hư hỏng",
                depositSettlement.grossFineAmount(),
                depositSettlement.depositAppliedAmount(),
                depositSettlement.additionalAmountDue()),
            "/userpage/fines",
            issueFine.getId()
        ));
        kafkaTemplate.send(KafkaTopics.LIBRARY_EMAIL, new LibraryEmailMessage(
            entity.getUserId(),
            LibraryEmailMessage.RETURN_CONFIRMED,
            Map.of(
                "publicationTitle", item.publicationTitle(),
                "returnDate", today.format(RETURN_DATE_FMT),
                "depositAmount", formatVnd(depositSettlement.depositAmount()),
                "grossFineAmount", formatVnd(depositSettlement.grossFineAmount()),
                "depositAppliedAmount", formatVnd(depositSettlement.depositAppliedAmount()),
                "depositRefundAmount", formatVnd(depositSettlement.depositRefundAmount()),
                "additionalAmountDue", formatVnd(depositSettlement.additionalAmountDue()),
                "actionPath", "/userpage/my-books?highlight=" + transactionId
            )
        ));

        log.info("Issue reported: transactionId={}, type={}, itemStatus={}, fines={}",
            transactionId, command.type(), newItemStatus, finesCreated.size());

        return ReportIssueResponse.builder()
            .transactionId(transactionId)
            .publicationTitle(item.publicationTitle())
            .itemStatus(newItemStatus)
            .finesCreated(finesCreated)
            .depositAmount(depositSettlement.depositAmount())
            .depositStatus(depositSettlement.depositStatus())
            .grossFineAmount(depositSettlement.grossFineAmount())
            .depositAppliedAmount(depositSettlement.depositAppliedAmount())
            .depositRefundAmount(depositSettlement.depositRefundAmount())
            .additionalAmountDue(depositSettlement.additionalAmountDue())
            .build();
    }

    private BorrowingTransaction toDomain(BorrowingTransactionEntity e) {
        return BorrowingTransaction.of(
            TransactionId.of(e.getId()),
            UserId.of(e.getUserId()),
            ItemId.of(e.getItemId()),
            e.getLibrarianIdIssue() != null ? UserId.of(e.getLibrarianIdIssue()) : null,
            e.getLibrarianIdReturn() != null ? UserId.of(e.getLibrarianIdReturn()) : null,
            e.getBorrowedDate(),
            e.getDueDate(),
            e.getReturnedDate(),
            e.getPickedUpDeadline(),
            e.getStatus(),
            e.getRenewalCount() != null ? e.getRenewalCount() : 0
        );
    }

    private void applyToEntity(BorrowingTransaction domain, BorrowingTransactionEntity entity) {
        entity.setStatus(domain.getStatus());
        entity.setReturnedDate(domain.getReturnedDate());
        entity.setLibrarianIdReturn(
            domain.getLibrarianIdReturn() != null ? domain.getLibrarianIdReturn().getValue() : null);
    }

    private String formatVnd(BigDecimal amount) {
        return (amount == null ? BigDecimal.ZERO : amount).toPlainString() + "đ";
    }
}
