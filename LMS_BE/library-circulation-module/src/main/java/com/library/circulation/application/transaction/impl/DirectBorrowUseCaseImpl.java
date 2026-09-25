package com.library.circulation.application.transaction.impl;

import com.library.catalog.domain.valueobject.ItemId;
import com.library.circulation.application.deposit.BorrowDepositService;
import com.library.circulation.application.policy.CirculationPolicy;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.application.transaction.DirectBorrowUseCase;
import com.library.circulation.domain.entities.BorrowingTransaction;
import com.library.circulation.dto.request.DirectBorrowCommand;
import com.library.circulation.dto.response.BorrowTransactionResponse;
import com.library.circulation.infrastructure.persistence.entity.BorrowingTransactionEntity;
import com.library.circulation.infrastructure.persistence.repository.BorrowingTransactionJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.LibraryEmailMessage;
import com.library.shared.kafka.event.NotificationMessage;
import com.library.shared.service.LibrarianNotificationService;
import com.library.shared.util.TsIdGenerator;
import com.library.user.domain.valueobject.UserId;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
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
public class DirectBorrowUseCaseImpl implements DirectBorrowUseCase {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DUE_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final String FIND_USER_SQL = """
        SELECT id, student_id, full_name FROM users
        WHERE student_id = :studentId AND status = 'ACTIVE'
        """;

    private static final String COUNT_ACTIVE_BORROWS_SQL = """
        SELECT COUNT(*) FROM borrowing_transactions
        WHERE user_id = :userId AND status IN ('WAITING_FOR_PICKUP', 'BORROWING')
        """;

    private static final String COUNT_UNPAID_FINES_SQL = """
        SELECT COUNT(*) FROM fines f
        JOIN borrowing_transactions bt ON bt.id = f.transaction_id
        WHERE bt.user_id = :userId AND f.payment_status = 'UNPAID'
        """;

    private final com.library.shared.port.ItemStatusPort itemStatusPort;
    private final BorrowingTransactionJpaRepository transactionJpaRepository;
    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final com.library.shared.port.UserInteractionPort userInteractionPort;
    private final CirculationPolicyService policyService;
    private final LibrarianNotificationService librarianNotificationService;
    private final BorrowDepositService borrowDepositService;

    @Override
    @Transactional
    public BorrowTransactionResponse execute(Long librarianId, DirectBorrowCommand command) {
        CirculationPolicy policy = policyService.getPolicy();

        // 1. Find user by studentId
        List<Map<String, Object>> users = jdbcTemplate.queryForList(
            FIND_USER_SQL, Map.of("studentId", command.studentId()));
        if (users.isEmpty()) throw new AppException(ErrorCode.USER_NOT_FOUND);
        Long userId = ((Number) users.get(0).get("id")).longValue();
        String studentCode = (String) users.get(0).get("student_id");
        String studentName = (String) users.get(0).get("full_name");

        // 2. Lock item by barcode
        com.library.shared.port.ItemSnapshot item = itemStatusPort.lockAndGetByBarcode(command.barcode());

        // 3. Cross-aggregate checks
        boolean reservedForThisUser = false;
        Long completedReservationId = null;
        if ("RESERVED".equals(item.status())) {
            // Allow only if this user has a READY_FOR_PICKUP reservation for this item
            List<Map<String, Object>> resRows = jdbcTemplate.queryForList("""
                SELECT r.id FROM reservations r
                WHERE r.user_id = :userId
                  AND r.publication_id = :publicationId
                  AND r.status = 'READY_FOR_PICKUP'
                  AND r.assigned_item_id = :itemId
                LIMIT 1
                """,
                Map.of("userId", userId, "publicationId", item.publicationId(), "itemId", item.id()));
            if (resRows.isEmpty()) throw new AppException(ErrorCode.ITEM_NOT_BORROWABLE);
            reservedForThisUser = true;
            completedReservationId = ((Number) resRows.get(0).get("id")).longValue();
        } else if (!"AVAILABLE".equals(item.status())) {
            throw new AppException(ErrorCode.ITEM_NOT_BORROWABLE);
        }

        Long activeBorrows = jdbcTemplate.queryForObject(
            COUNT_ACTIVE_BORROWS_SQL, Map.of("userId", userId), Long.class);
        if (activeBorrows != null && activeBorrows >= policy.maxActiveBorrows()) {
            throw new AppException(ErrorCode.USER_BORROW_LIMIT_EXCEEDED);
        }

        if (Boolean.TRUE.equals(policy.blockBorrowWhenUnpaidFines())) {
            Long unpaidFines = jdbcTemplate.queryForObject(
                COUNT_UNPAID_FINES_SQL, Map.of("userId", userId), Long.class);
            if (unpaidFines != null && unpaidFines > 0) {
                throw new AppException(ErrorCode.USER_HAS_UNPAID_FINES);
            }
        }

        if (!reservedForThisUser
            && transactionJpaRepository.existsByUserIdAndPublicationId(userId, item.publicationId())) {
            throw new AppException(ErrorCode.RESERVATION_ALREADY_EXISTS);
        }

        // 4. Domain: create direct borrow (status = BORROWING immediately)
        LocalDate dueDate = LocalDate.now(ZONE).plusDays(policy.defaultLoanDays());
        BorrowingTransaction transaction = BorrowingTransaction.createDirectBorrow(
            UserId.of(userId), ItemId.of(item.id()), UserId.of(librarianId), dueDate);

        // 5. Infrastructure: update item + persist
        itemStatusPort.updateStatus(item.id(), "BORROWED");
        // Mark reservation COMPLETED if this was a reserved pickup
        if (reservedForThisUser && completedReservationId != null) {
            jdbcTemplate.update("""
                UPDATE reservations SET status = 'COMPLETED', updated_at = NOW()
                WHERE id = :id AND status = 'READY_FOR_PICKUP'
                """, Map.of("id", completedReservationId));
        }
        BorrowingTransactionEntity entity = toEntity(transaction);
        transactionJpaRepository.save(entity);
        transactionJpaRepository.flush();
        BorrowDepositService.DepositSnapshot deposit = borrowDepositService.collectForBorrow(
            entity.getId(), librarianId, policy.defaultDepositAmount());

        kafkaTemplate.send(KafkaTopics.NOTIFICATION_SEND, new NotificationMessage(
            userId,
            "PICKUP_CONFIRMED",
            "Sách đã được giao",
            String.format("Bạn đã mượn '%s' tại thư viện. Hạn trả: %s. Tiền cọc đã thu: %sđ.",
                item.publicationTitle(), dueDate.format(DUE_DATE_FMT), deposit.depositAmount()),
            "/userpage/my-books?highlight=" + entity.getId(),
            entity.getId()
        ));
        kafkaTemplate.send(KafkaTopics.LIBRARY_EMAIL, new LibraryEmailMessage(
            userId,
            LibraryEmailMessage.PICKUP_CONFIRMED,
            Map.of(
                "publicationTitle", item.publicationTitle(),
                "dueDate", dueDate.format(DUE_DATE_FMT),
                "depositAmount", formatVnd(deposit.depositAmount()),
                "actionPath", "/userpage/my-books?highlight=" + entity.getId()
            )
        ));

        userInteractionPort.record(userId, item.publicationId(), com.library.shared.port.UserInteractionPort.TYPE_BORROW);
        librarianNotificationService.notifyAll(
            "LIB_CIRC_PICKUP",
            "Sinh viên đã nhận sách",
            String.format("%s (%s) đã nhận '%s' - bản sao %s. Hạn trả: %s. Đã thu cọc: %sđ.",
                studentName, studentCode, item.publicationTitle(), item.barcode(), dueDate.format(DUE_DATE_FMT),
                deposit.depositAmount()),
            "/librarianpage/transactions?highlight=" + entity.getId(),
            entity.getId()
        );
        log.info("Direct borrow created: transactionId={}, userId={}, itemId={}, librarianId={}",
            entity.getId(), userId, item.id(), librarianId);

        return BorrowTransactionResponse.builder()
            .transactionId(entity.getId())
            .itemId(item.id())
            .barcode(item.barcode())
            .publicationId(item.publicationId())
            .publicationTitle(item.publicationTitle())
            .branch(item.branch())
            .location(item.location())
            .dueDate(dueDate)
            .status(entity.getStatus())
            .depositAmount(deposit.depositAmount())
            .depositStatus(deposit.depositStatus())
            .build();
    }

    private BorrowingTransactionEntity toEntity(BorrowingTransaction domain) {
        BorrowingTransactionEntity entity = BorrowingTransactionEntity.builder()
            .userId(domain.getUserId().getValue())
            .itemId(domain.getItemId().getValue())
            .librarianIdIssue(domain.getLibrarianIdIssue().getValue())
            .borrowedDate(domain.getBorrowedDate())
            .pickedUpDeadline(domain.getPickedUpDeadline())
            .dueDate(domain.getDueDate())
            .status(domain.getStatus())
            .renewalCount(domain.getRenewalCount())
            .build();
        entity.setId(domain.getId().getValue());
        return entity;
    }

    private String formatVnd(java.math.BigDecimal amount) {
        return (amount == null ? java.math.BigDecimal.ZERO : amount).toPlainString() + "đ";
    }
}
