package com.library.circulation.application.transaction.impl;

import com.library.catalog.domain.valueobject.ItemId;
import com.library.circulation.application.deposit.BorrowDepositService;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.application.transaction.ConfirmPickupUseCase;
import com.library.circulation.domain.entities.BorrowingTransaction;
import com.library.circulation.domain.enums.TransactionStatus;
import com.library.circulation.domain.valueobject.TransactionId;
import com.library.circulation.dto.response.BorrowTransactionResponse;
import com.library.circulation.infrastructure.persistence.entity.BorrowingTransactionEntity;
import com.library.circulation.infrastructure.persistence.repository.BorrowingTransactionJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.LibraryEmailMessage;
import com.library.shared.kafka.event.NotificationMessage;
import com.library.shared.service.LibrarianNotificationService;
import com.library.user.domain.valueobject.UserId;
import java.util.Map;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConfirmPickupUseCaseImpl implements ConfirmPickupUseCase {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private static final DateTimeFormatter DUE_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final BorrowingTransactionJpaRepository transactionJpaRepository;
    private final com.library.shared.port.ItemStatusPort itemStatusPort;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final com.library.shared.port.UserInteractionPort userInteractionPort;
    private final CirculationPolicyService policyService;
    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final LibrarianNotificationService librarianNotificationService;
    private final BorrowDepositService borrowDepositService;

    @Override
    @Transactional
    public BorrowTransactionResponse execute(Long transactionId, Long librarianId) {
        // Infrastructure: load JPA entity
        BorrowingTransactionEntity entity = transactionJpaRepository.findById(transactionId)
            .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        // Infrastructure: lock item
        com.library.shared.port.ItemSnapshot item = itemStatusPort.lockAndGet(entity.getItemId());

        // Reconstruct domain entity from persistence
        BorrowingTransaction transaction = toDomain(entity);

        // Domain: confirmPickup contains invariant (status must be WAITING_FOR_PICKUP)
        LocalDate actualDueDate = LocalDate.now(ZONE).plusDays(policyService.getPolicy().defaultLoanDays());
        transaction.confirmPickup(UserId.of(librarianId), actualDueDate);

        // Infrastructure: update item and persist transaction
        itemStatusPort.updateStatus(entity.getItemId(), "BORROWED");
        applyToEntity(transaction, entity);
        transactionJpaRepository.save(entity);
        transactionJpaRepository.flush();
        BorrowDepositService.DepositSnapshot deposit = borrowDepositService.collectForBorrow(
            entity.getId(), librarianId, policyService.getPolicy().defaultDepositAmount());

        // Publish in-app notification
        kafkaTemplate.send(KafkaTopics.NOTIFICATION_SEND, new NotificationMessage(
            entity.getUserId(),
            "PICKUP_CONFIRMED",
            "Sách đã được giao",
            String.format("Bạn đã nhận '%s'. Hạn trả: %s. Tiền cọc đã thu: %sđ.",
                item.publicationTitle(),
                entity.getDueDate().format(DUE_DATE_FMT),
                deposit.depositAmount()),
            "/userpage/my-books?highlight=" + entity.getId(),
            entity.getId()
        ));
        kafkaTemplate.send(KafkaTopics.LIBRARY_EMAIL, new LibraryEmailMessage(
            entity.getUserId(),
            LibraryEmailMessage.PICKUP_CONFIRMED,
            Map.of(
                "publicationTitle", item.publicationTitle(),
                "dueDate", entity.getDueDate().format(DUE_DATE_FMT),
                "depositAmount", formatVnd(deposit.depositAmount()),
                "actionPath", "/userpage/my-books?highlight=" + entity.getId()
            )
        ));

        userInteractionPort.record(entity.getUserId(), item.publicationId(), com.library.shared.port.UserInteractionPort.TYPE_BORROW);
        Map<String, Object> student = jdbcTemplate.queryForMap(
            "SELECT full_name, student_id FROM users WHERE id = :userId",
            Map.of("userId", entity.getUserId())
        );
        librarianNotificationService.notifyAll(
            "LIB_CIRC_PICKUP",
            "Sinh viên đã nhận sách",
            String.format("%s (%s) đã nhận '%s' - bản sao %s. Hạn trả: %s. Đã thu cọc: %sđ.",
                student.get("full_name"), student.get("student_id"), item.publicationTitle(), item.barcode(),
                entity.getDueDate().format(DUE_DATE_FMT), deposit.depositAmount()),
            "/librarianpage/transactions?highlight=" + entity.getId(),
            entity.getId()
        );
        log.info("Pickup confirmed: transactionId={}, librarianId={}", transactionId, librarianId);

        return BorrowTransactionResponse.builder()
            .transactionId(entity.getId())
            .itemId(entity.getItemId())
            .barcode(item.barcode())
            .publicationId(item.publicationId())
            .publicationTitle(item.publicationTitle())
            .branch(item.branch())
            .location(item.location())
            .dueDate(entity.getDueDate())
            .status(entity.getStatus())
            .depositAmount(deposit.depositAmount())
            .depositStatus(deposit.depositStatus())
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
        entity.setBorrowedDate(domain.getBorrowedDate());
        entity.setDueDate(domain.getDueDate());
        entity.setLibrarianIdIssue(
            domain.getLibrarianIdIssue() != null ? domain.getLibrarianIdIssue().getValue() : null);
    }

    private String formatVnd(java.math.BigDecimal amount) {
        return (amount == null ? java.math.BigDecimal.ZERO : amount).toPlainString() + "đ";
    }
}
