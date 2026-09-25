package com.library.circulation.application.transaction.impl;

import com.library.catalog.domain.valueobject.ItemId;
import com.library.circulation.application.policy.CirculationPolicy;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.application.transaction.BorrowRequestUseCase;
import com.library.circulation.domain.entities.BorrowingTransaction;
import com.library.circulation.dto.request.BorrowRequestCommand;
import com.library.circulation.dto.response.BorrowTransactionResponse;
import com.library.circulation.infrastructure.persistence.entity.BorrowingTransactionEntity;
import com.library.circulation.infrastructure.persistence.repository.BorrowingTransactionJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.LibraryEmailMessage;
import com.library.shared.kafka.event.NotificationMessage;
import com.library.user.domain.valueobject.UserId;
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
public class BorrowRequestUseCaseImpl implements BorrowRequestUseCase {

  private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

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
  private final CirculationPolicyService policyService;

  @Override
  @Transactional
  public BorrowTransactionResponse execute(Long userId, BorrowRequestCommand command) {
    Long itemId = command.itemId();
    CirculationPolicy policy = policyService.getPolicy();

    // Infrastructure: pessimistic lock + fetch item
    com.library.shared.port.ItemSnapshot item = itemStatusPort.lockAndGet(itemId);

    // Application: cross-aggregate checks
    if (!"AVAILABLE".equals(item.status())) {
      throw new AppException(ErrorCode.ITEM_NOT_BORROWABLE);
    }

    // đếm xem mượn bao nhiều sách rồi
    Long activeBorrows = jdbcTemplate.queryForObject(
        COUNT_ACTIVE_BORROWS_SQL, Map.of("userId", userId), Long.class);
    if (activeBorrows != null && activeBorrows >= policy.maxActiveBorrows()) {
      throw new AppException(ErrorCode.USER_BORROW_LIMIT_EXCEEDED);
    }

    // check xem có phí phạt nào chưa trả không
    if (Boolean.TRUE.equals(policy.blockBorrowWhenUnpaidFines())) {
      Long unpaidFines = jdbcTemplate.queryForObject(
          COUNT_UNPAID_FINES_SQL, Map.of("userId", userId), Long.class);
      if (unpaidFines != null && unpaidFines > 0) {
        throw new AppException(ErrorCode.USER_HAS_UNPAID_FINES);
      }
    }

    // check xem đã mượn cuốn sách nào như vâỵ chưa (1 dạng sách chỉ mượn được 1 cuốn thôi)
    if (transactionJpaRepository.existsByUserIdAndPublicationId(userId, item.publicationId())) {
      throw new AppException(ErrorCode.RESERVATION_ALREADY_EXISTS);
    }

    // Infrastructure: reserve item
    itemStatusPort.updateStatus(itemId, "RESERVED");

    // Domain: create transaction (business logic lives here)
    Instant pickupDeadline = Instant.now().plusSeconds(policy.pickupDeadlineHours() * 3600L);
    LocalDate initialDueDate = LocalDate.now(ZONE).plusDays(policy.defaultLoanDays());
    BorrowingTransaction transaction = BorrowingTransaction.createBorrowRequest(
        UserId.of(userId), ItemId.of(itemId), pickupDeadline, initialDueDate);

    // Infrastructure: persist
    BorrowingTransactionEntity entity = toEntity(transaction);
    transactionJpaRepository.save(entity);

    // Application: publish in-app notification
    String location = buildLocation(item.branch(), item.location());
    kafkaTemplate.send(KafkaTopics.NOTIFICATION_SEND, new NotificationMessage(
        userId, "BORROW_SUCCESS",
        "Yêu cầu mượn sách đã được tạo",
        String.format("Bạn đã đặt mượn '%s'. Đến %s để nhận sách trước %d giờ.",
            item.publicationTitle(), location, policy.pickupDeadlineHours()),
        "/userpage/my-books?highlight=" + entity.getId(), entity.getId()
    ));

    // Application: publish email notification
    String formattedDeadline = pickupDeadline.atZone(ZONE)
        .format(DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy"));
    kafkaTemplate.send(KafkaTopics.LIBRARY_EMAIL, new LibraryEmailMessage(
        userId,
        LibraryEmailMessage.BORROW_PICKUP_REMINDER,
        java.util.Map.of(
            "publicationTitle", item.publicationTitle(),
            "location", location,
            "deadline", formattedDeadline,
            "actionPath", "/userpage/my-books?highlight=" + entity.getId()
        )
    ));

    log.info("Borrow request created: transactionId={}, userId={}, itemId={}",
        entity.getId(), userId, itemId);

    return toResponse(entity, item);
  }

  private BorrowingTransactionEntity toEntity(BorrowingTransaction domain) {
    BorrowingTransactionEntity entity = BorrowingTransactionEntity.builder()
        .userId(domain.getUserId().getValue())
        .itemId(domain.getItemId().getValue())
        .pickedUpDeadline(domain.getPickedUpDeadline())
        .dueDate(domain.getDueDate())
        .status(domain.getStatus())
        .renewalCount(domain.getRenewalCount())
        .build();
    entity.setId(domain.getId().getValue());
    return entity;
  }

  private BorrowTransactionResponse toResponse(BorrowingTransactionEntity entity,
      com.library.shared.port.ItemSnapshot item) {
    return BorrowTransactionResponse.builder()
        .transactionId(entity.getId())
        .itemId(entity.getItemId())
        .barcode(item.barcode())
        .publicationId(item.publicationId())
        .publicationTitle(item.publicationTitle())
        .branch(item.branch())
        .location(item.location())
        .pickedUpDeadline(entity.getPickedUpDeadline())
        .dueDate(entity.getDueDate())
        .status(entity.getStatus())
        .build();
  }

  private String buildLocation(String branch, String location) {
    if (branch != null && location != null) {
      return branch + " - " + location;
    }
    if (branch != null) {
      return branch;
    }
    if (location != null) {
      return location;
    }
    return "thư viện";
  }
}
