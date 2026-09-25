package com.library.circulation.application.transaction.impl;

import com.library.circulation.application.transaction.RestoreLostBookUseCase;
import com.library.circulation.dto.request.RestoreLostBookCommand;
import com.library.circulation.dto.response.RestoreLostBookResponse;
import com.library.circulation.infrastructure.persistence.entity.BorrowingTransactionEntity;
import com.library.circulation.infrastructure.persistence.repository.BorrowingTransactionJpaRepository;
import com.library.shared.constant.RoleConstants;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.NotificationMessage;
import com.library.shared.service.AuditLogService;
import com.library.shared.util.TsIdGenerator;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestoreLostBookUseCaseImpl implements RestoreLostBookUseCase {

    private static final String FIND_LOST_FINES_SQL = """
        SELECT id, fine_amount
        FROM fines
        WHERE transaction_id = :transactionId
          AND type = 'LOST_BOOK'
        ORDER BY created_at ASC, id ASC
        """;

    private final com.library.shared.port.ItemStatusPort itemStatusPort;
    private final BorrowingTransactionJpaRepository transactionJpaRepository;
    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public RestoreLostBookResponse execute(Long transactionId, Long librarianId, RestoreLostBookCommand command) {
        String newItemStatus = normalizeNewStatus(command.newItemStatus());
        String recoveryReason = normalizeRecoveryReason(command.recoveryReason());
        BigDecimal refundAmount = positive(command.refundAmount());
        String note = buildNote(recoveryReason, command.note());

        BorrowingTransactionEntity transaction = transactionJpaRepository.findById(transactionId)
            .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND));

        com.library.shared.port.ItemSnapshot item = itemStatusPort.lockAndGet(transaction.getItemId());
        if (command.barcode() != null && !command.barcode().isBlank()
            && !item.barcode().equals(command.barcode().trim())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (!"LOST".equals(item.status())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        List<Map<String, Object>> lostFines = jdbcTemplate.queryForList(
            FIND_LOST_FINES_SQL, Map.of("transactionId", transactionId));
        if (lostFines.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        BigDecimal reversedLostFineAmount = lostFines.stream()
            .map(row -> positive((BigDecimal) row.get("fine_amount")))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        itemStatusPort.updateStatus(item.id(), newItemStatus);
        jdbcTemplate.update("""
            UPDATE fines
            SET fine_amount = 0,
                payment_status = 'PAID',
                paid_date = COALESCE(paid_date, NOW()),
                paid_by_librarian_id = COALESCE(paid_by_librarian_id, :librarianId),
                updated_at = NOW()
            WHERE transaction_id = :transactionId
              AND type = 'LOST_BOOK'
            """, Map.of("transactionId", transactionId, "librarianId", librarianId));

        Long recoveryId = TsIdGenerator.next();
        jdbcTemplate.update("""
            INSERT INTO lost_book_recoveries (
                id, transaction_id, user_id, item_id, librarian_id, previous_item_status,
                new_item_status, recovery_reason, reversed_lost_fine_amount, refund_amount, note,
                created_at, updated_at
            )
            VALUES (
                :id, :transactionId, :userId, :itemId, :librarianId, 'LOST',
                :newItemStatus, :recoveryReason, :reversedLostFineAmount, :refundAmount, :note,
                NOW(), NOW()
            )
            """, new MapSqlParameterSource()
                .addValue("id", recoveryId)
                .addValue("transactionId", transactionId)
                .addValue("userId", transaction.getUserId())
                .addValue("itemId", item.id())
                .addValue("librarianId", librarianId)
                .addValue("newItemStatus", newItemStatus)
                .addValue("recoveryReason", recoveryReason)
                .addValue("reversedLostFineAmount", reversedLostFineAmount)
                .addValue("refundAmount", refundAmount)
                .addValue("note", note.isBlank() ? null : note));

        auditLogService.log(
            librarianId,
            RoleConstants.LIBRARIAN,
            "RESTORE_LOST_BOOK",
            "lost_book_recoveries",
            recoveryId,
            "Librarian restored a previously lost book copy and reversed lost-book fine",
            Map.of(
                "transactionId", transactionId,
                "itemId", item.id(),
                "barcode", item.barcode(),
                "newItemStatus", newItemStatus,
                "recoveryReason", recoveryReason,
                "reversedLostFineAmount", reversedLostFineAmount,
                "refundAmount", refundAmount
            )
        );

        kafkaTemplate.send(KafkaTopics.NOTIFICATION_SEND, new NotificationMessage(
            transaction.getUserId(),
            "LOST_BOOK_RECOVERED",
            "Sách báo mất đã được tìm lại",
            String.format("Sách '%s' đã được thủ thư ghi nhận tìm lại. Phí mất sách được đảo %sđ, số tiền hoàn/ghi nhận hoàn: %sđ.",
                item.publicationTitle(), reversedLostFineAmount, refundAmount),
            "/userpage/my-books?highlight=" + transactionId,
            recoveryId
        ));

        log.info("Lost book restored: recoveryId={}, transactionId={}, itemId={}, refundAmount={}",
            recoveryId, transactionId, item.id(), refundAmount);

        return RestoreLostBookResponse.builder()
            .recoveryId(recoveryId)
            .transactionId(transactionId)
            .publicationTitle(item.publicationTitle())
            .barcode(item.barcode())
            .itemStatus(newItemStatus)
            .reversedLostFineAmount(reversedLostFineAmount)
            .refundAmount(refundAmount)
            .recoveryReason(recoveryReason)
            .note(note)
            .build();
    }

    private String normalizeNewStatus(String value) {
        String status = value == null ? "" : value.trim().toUpperCase();
        if ("AVAILABLE".equals(status) || "IN_MAINTENANCE".equals(status)) {
            return status;
        }
        throw new AppException(ErrorCode.INVALID_REQUEST);
    }

    private String normalizeRecoveryReason(String value) {
        String reason = value == null ? "" : value.trim().toUpperCase();
        if ("READER_FOUND".equals(reason)
            || "LIBRARY_FOUND".equals(reason)
            || "INVENTORY_FOUND".equals(reason)
            || "OTHER".equals(reason)) {
            return reason;
        }
        throw new AppException(ErrorCode.INVALID_REQUEST);
    }

    private String buildNote(String recoveryReason, String manualNote) {
        String reasonText = switch (recoveryReason) {
            case "READER_FOUND" -> "Bạn đọc tìm lại và nộp tại quầy";
            case "LIBRARY_FOUND" -> "Thư viện tìm thấy trong khuôn viên/kho";
            case "INVENTORY_FOUND" -> "Tìm thấy khi kiểm kê";
            default -> "Lý do khác";
        };
        String note = manualNote == null ? "" : manualNote.trim();
        return note.isBlank() ? reasonText : reasonText + " - " + note;
    }

    private BigDecimal positive(BigDecimal value) {
        if (value == null || value.signum() < 0) return BigDecimal.ZERO;
        return value;
    }
}
