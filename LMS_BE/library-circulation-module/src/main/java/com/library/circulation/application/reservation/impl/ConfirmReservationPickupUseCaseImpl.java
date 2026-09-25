package com.library.circulation.application.reservation.impl;

import com.library.circulation.application.deposit.BorrowDepositService;
import com.library.circulation.application.policy.CirculationPolicy;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.application.reservation.ConfirmReservationPickupUseCase;
import com.library.circulation.domain.enums.ReservationStatus;
import com.library.circulation.domain.enums.TransactionStatus;
import com.library.circulation.dto.response.BorrowTransactionResponse;
import com.library.circulation.infrastructure.persistence.entity.BorrowingTransactionEntity;
import com.library.circulation.infrastructure.persistence.entity.ReservationEntity;
import com.library.circulation.infrastructure.persistence.repository.BorrowingTransactionJpaRepository;
import com.library.circulation.infrastructure.persistence.repository.ReservationJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.LibraryEmailMessage;
import com.library.shared.kafka.event.NotificationMessage;
import com.library.shared.service.LibrarianNotificationService;
import com.library.shared.util.TsIdGenerator;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
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
public class ConfirmReservationPickupUseCaseImpl implements ConfirmReservationPickupUseCase {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DUE_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ReservationJpaRepository reservationJpaRepository;
    private final BorrowingTransactionJpaRepository transactionJpaRepository;
    private final com.library.shared.port.ItemStatusPort itemStatusPort;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final CirculationPolicyService policyService;
    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final LibrarianNotificationService librarianNotificationService;
    private final BorrowDepositService borrowDepositService;

    @Override
    @Transactional
    public BorrowTransactionResponse execute(Long reservationId, Long librarianId) {
        // 1. Load reservation
        ReservationEntity reservation = reservationJpaRepository.findById(reservationId)
            .orElseThrow(() -> new AppException(ErrorCode.RESERVATION_NOT_FOUND));

        // 2. Validate status
        if (reservation.getStatus() != ReservationStatus.READY_FOR_PICKUP) {
            throw new AppException(ErrorCode.RESERVATION_NOT_READY);
        }

        if (reservation.getAssignedItemId() == null) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION); // Should not happen if READY_FOR_PICKUP
        }

        // 3. Lock and Get Item details
        com.library.shared.port.ItemSnapshot item = itemStatusPort.lockAndGet(reservation.getAssignedItemId());
        
        // 4. Update Reservation to COMPLETED
        reservation.setStatus(ReservationStatus.COMPLETED);
        reservation.setUpdatedAt(Instant.now());
        reservationJpaRepository.save(reservation);

        // 5. Create BorrowingTransaction
        CirculationPolicy policy = policyService.getPolicy();
        LocalDate dueDate = LocalDate.now(ZONE).plusDays(policy.defaultLoanDays());
        
        BorrowingTransactionEntity transaction = BorrowingTransactionEntity.builder()
            .userId(reservation.getUserId())
            .itemId(reservation.getAssignedItemId())
            .librarianIdIssue(librarianId)
            .borrowedDate(Instant.now())
            .dueDate(dueDate)
            .pickedUpDeadline(Instant.now())
            .status(TransactionStatus.BORROWING)
            .renewalCount(0)
            .build();
        transaction.setId(TsIdGenerator.next());

        transactionJpaRepository.save(transaction);
        transactionJpaRepository.flush();

        // 6. Update Item Status
        itemStatusPort.updateStatus(reservation.getAssignedItemId(), "BORROWED");
        BorrowDepositService.DepositSnapshot deposit = borrowDepositService.collectForBorrow(
            transaction.getId(), librarianId, policy.defaultDepositAmount());

        // 7. Notify User
        kafkaTemplate.send(KafkaTopics.NOTIFICATION_SEND, new NotificationMessage(
            reservation.getUserId(),
            "PICKUP_CONFIRMED",
            "Sách đã được giao (từ đặt trước)",
            String.format("Bạn đã nhận '%s' đặt trước. Hạn trả: %s. Tiền cọc đã thu: %sđ.",
                item.publicationTitle(),
                dueDate.format(DUE_DATE_FMT),
                deposit.depositAmount()),
            "/userpage/my-books?highlight=" + transaction.getId(),
            transaction.getId()
        ));
        kafkaTemplate.send(KafkaTopics.LIBRARY_EMAIL, new LibraryEmailMessage(
            reservation.getUserId(),
            LibraryEmailMessage.PICKUP_CONFIRMED,
            Map.of(
                "publicationTitle", item.publicationTitle(),
                "dueDate", dueDate.format(DUE_DATE_FMT),
                "depositAmount", formatVnd(deposit.depositAmount()),
                "actionPath", "/userpage/my-books?highlight=" + transaction.getId()
            )
        ));
        Map<String, Object> student = jdbcTemplate.queryForMap(
            "SELECT full_name, student_id FROM users WHERE id = :userId",
            Map.of("userId", reservation.getUserId())
        );
        librarianNotificationService.notifyAll(
            "LIB_CIRC_PICKUP",
            "Sinh viên đã nhận sách đặt trước",
            String.format("%s (%s) đã nhận '%s' - bản sao %s từ lượt đặt trước. Hạn trả: %s. Đã thu cọc: %sđ.",
                student.get("full_name"), student.get("student_id"), item.publicationTitle(), item.barcode(),
                dueDate.format(DUE_DATE_FMT), deposit.depositAmount()),
            "/librarianpage/transactions?highlight=" + transaction.getId(),
            transaction.getId()
        );

        log.info("Reservation pickup confirmed: reservationId={}, transactionId={}, librarianId={}", 
            reservationId, transaction.getId(), librarianId);

        return BorrowTransactionResponse.builder()
            .transactionId(transaction.getId())
            .itemId(transaction.getItemId())
            .barcode(item.barcode())
            .publicationId(item.publicationId())
            .publicationTitle(item.publicationTitle())
            .branch(item.branch())
            .location(item.location())
            .dueDate(transaction.getDueDate())
            .status(transaction.getStatus())
            .depositAmount(deposit.depositAmount())
            .depositStatus(deposit.depositStatus())
            .build();
    }

    private String formatVnd(java.math.BigDecimal amount) {
        return (amount == null ? java.math.BigDecimal.ZERO : amount).toPlainString() + "đ";
    }
}
