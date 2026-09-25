package com.library.circulation.application.transaction.impl;

import com.library.catalog.domain.valueobject.ItemId;
import com.library.circulation.application.credit.ReaderCreditScoreService;
import com.library.circulation.application.deposit.BorrowDepositService;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.application.transaction.ReturnBookUseCase;
import com.library.circulation.domain.entities.BorrowingTransaction;
import com.library.circulation.domain.valueobject.TransactionId;
import com.library.circulation.dto.request.ReturnCommand;
import com.library.circulation.dto.response.ReturnResponse;
import com.library.circulation.infrastructure.persistence.entity.BorrowingTransactionEntity;
import com.library.circulation.infrastructure.persistence.entity.FineEntity;
import com.library.circulation.infrastructure.persistence.repository.BorrowingTransactionJpaRepository;
import com.library.circulation.infrastructure.persistence.repository.FineJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.LibraryEmailMessage;
import com.library.shared.kafka.event.NotificationMessage;
import com.library.circulation.infrastructure.service.ReservationAssignmentService;
import com.library.circulation.infrastructure.service.WishlistAvailabilityNotificationService;
import com.library.shared.service.LibrarianNotificationService;
import com.library.shared.util.TsIdGenerator;
import com.library.user.domain.enums.ViolationType;
import com.library.user.domain.valueobject.UserId;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReturnBookUseCaseImpl implements ReturnBookUseCase {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String FIND_ACTIVE_TRANSACTION_SQL = """
        SELECT t.id
        FROM borrowing_transactions t
        WHERE t.item_id = :itemId
          AND t.status IN ('BORROWING', 'OVERDUE')
        ORDER BY t.borrowed_date DESC
        LIMIT 1
        """;

    private final com.library.shared.port.ItemStatusPort itemStatusPort;
    private final BorrowingTransactionJpaRepository transactionJpaRepository;
    private final FineJpaRepository fineJpaRepository;
    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ReservationAssignmentService reservationAssignmentService;
    private final CirculationPolicyService policyService;
    private final LibrarianNotificationService librarianNotificationService;
    private final BorrowDepositService borrowDepositService;
    private final ReaderCreditScoreService readerCreditScoreService;
    private final WishlistAvailabilityNotificationService wishlistAvailabilityNotificationService;

    @Override
    @Transactional
    public ReturnResponse execute(Long librarianId, ReturnCommand command) {
        // 1. Lock item by barcode
        com.library.shared.port.ItemSnapshot item = itemStatusPort.lockAndGetByBarcode(command.barcode());

        // 2. Find active transaction for this item
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            FIND_ACTIVE_TRANSACTION_SQL, Map.of("itemId", item.id()));
        if (rows.isEmpty()) throw new AppException(ErrorCode.TRANSACTION_NOT_FOUND);
        Long transactionId = ((Number) rows.get(0).get("id")).longValue();

        // 3. Load JPA entity + reconstruct domain
        BorrowingTransactionEntity entity = transactionJpaRepository.findById(transactionId)
            .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));
        BorrowingTransaction transaction = toDomain(entity);

        // 4. Domain: processReturn (checks BORROWING | OVERDUE invariant)
        Instant now = Instant.now();
        transaction.processReturn(UserId.of(librarianId), now);
        boolean wasPublicationOutOfStock = wishlistAvailabilityNotificationService.isOutOfStock(item.publicationId());

        // 5. Update item → AVAILABLE, persist transaction
        itemStatusPort.updateStatus(item.id(), "AVAILABLE");
        applyToEntity(transaction, entity);
        transactionJpaRepository.save(entity);

        // 6. Auto fine if overdue
        LocalDate today = LocalDate.now(ZONE);
        boolean overdue = transaction.isOverdue(today);
        BigDecimal overdueFineAmount = null;
        long daysLate = 0;
        if (overdue) {
            daysLate = ChronoUnit.DAYS.between(transaction.getDueDate(), today);
            overdueFineAmount = policyService.getPolicy().overdueFinePerDay().multiply(BigDecimal.valueOf(daysLate));
            FineEntity fine = FineEntity.builder()
                .transactionId(transactionId)
                .fineAmount(overdueFineAmount)
                .type(ViolationType.OVERDUE_RETURN)
                .build();
            fine.setId(TsIdGenerator.next());
            fineJpaRepository.save(fine);
            log.info("Overdue fine created: transactionId={}, daysLate={}, amount={}",
                transactionId, daysLate, overdueFineAmount);
        }
        transactionJpaRepository.flush();
        fineJpaRepository.flush();
        BorrowDepositService.DepositSettlement depositSettlement =
            borrowDepositService.settleOnReturn(transactionId, librarianId);
        readerCreditScoreService.recordReturn(entity.getUserId(), daysLate);

        // 7. Check if any reservation is waiting for this book
        boolean assignedToReservation = reservationAssignmentService.tryAssign(item.id(), item.publicationId(), item.branch());
        if (wasPublicationOutOfStock && !assignedToReservation) {
            wishlistAvailabilityNotificationService.notifyWishlistWatchers(
                item.publicationId(),
                item.publicationTitle(),
                entity.getUserId()
            );
        }

        // 8. Notify + email
        LocalDate returnedDate = today;
        kafkaTemplate.send(KafkaTopics.NOTIFICATION_SEND, new NotificationMessage(
            entity.getUserId(),
            "RETURN_CONFIRMED",
            "Trả sách thành công - mời bạn đánh giá",
            String.format("Bạn đã trả sách '%s' thành công. Cọc: đã khấu trừ %sđ, hoàn %sđ, cần đóng thêm %sđ. Hãy chia sẻ trải nghiệm để nhận 5 điểm đóng góp.",
                item.publicationTitle(),
                depositSettlement.depositAppliedAmount(),
                depositSettlement.depositRefundAmount(),
                depositSettlement.additionalAmountDue()),
            String.format("/publicpage/book/%d?review=1", item.publicationId()),
            transactionId
        ));
        kafkaTemplate.send(KafkaTopics.LIBRARY_EMAIL, new LibraryEmailMessage(
            entity.getUserId(),
            LibraryEmailMessage.RETURN_CONFIRMED,
            Map.of(
                "publicationTitle", item.publicationTitle(),
                "returnDate", returnedDate.toString(),
                "depositAmount", formatVnd(depositSettlement.depositAmount()),
                "grossFineAmount", formatVnd(depositSettlement.grossFineAmount()),
                "depositAppliedAmount", formatVnd(depositSettlement.depositAppliedAmount()),
                "depositRefundAmount", formatVnd(depositSettlement.depositRefundAmount()),
                "additionalAmountDue", formatVnd(depositSettlement.additionalAmountDue()),
                "actionPath", String.format("/publicpage/book/%d?review=1", item.publicationId())
            )
        ));
        Map<String, Object> student = jdbcTemplate.queryForMap(
            "SELECT full_name, student_id FROM users WHERE id = :userId",
            Map.of("userId", entity.getUserId())
        );
        String fineText = overdueFineAmount == null ? "không phát sinh phí trễ hạn" : "phí trễ hạn " + overdueFineAmount + "đ";
        librarianNotificationService.notifyAll(
            "LIB_CIRC_RETURN",
            "Sinh viên đã trả sách",
            String.format("%s (%s) đã trả '%s' - bản sao %s. Tình trạng giao dịch: đã trả, %s. Cọc: thu %sđ, khấu trừ %sđ, hoàn %sđ, thu thêm %sđ.",
                student.get("full_name"), student.get("student_id"), item.publicationTitle(), item.barcode(),
                fineText,
                depositSettlement.depositAmount(),
                depositSettlement.depositAppliedAmount(),
                depositSettlement.depositRefundAmount(),
                depositSettlement.additionalAmountDue()),
            "/librarianpage/transactions?highlight=" + transactionId,
            transactionId
        );

        log.info("Book returned: transactionId={}, itemId={}, overdue={}", transactionId, item.id(), overdue);

        return ReturnResponse.builder()
            .transactionId(transactionId)
            .publicationTitle(item.publicationTitle())
            .barcode(item.barcode())
            .returnedDate(returnedDate)
            .overdue(overdue)
            .overdueFineAmount(overdueFineAmount)
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
