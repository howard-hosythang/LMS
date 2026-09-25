package com.library.circulation.infrastructure.persistence.entity;

import static java.time.temporal.ChronoUnit.DAYS;

import com.library.circulation.domain.enums.TransactionStatus;
import com.library.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicUpdate;

@Entity
@DynamicUpdate
@Table(name = "borrowing_transactions", indexes = {
    @Index(name = "idx_borrow_user_id", columnList = "userId"),
    @Index(name = "idx_borrow_item_id", columnList = "itemId"),
    @Index(name = "idx_borrow_due_date", columnList = "dueDate")
})
@Getter
@Setter
@AllArgsConstructor
@Builder
public class BorrowingTransactionEntity extends BaseEntity {

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(name = "item_id", nullable = false)
  private Long itemId;

  @Column(name = "librarian_id_issue")
  private Long librarianIdIssue;

  @Column(name = "librarian_id_return")
  private Long librarianIdReturn;

  @Column(name = "borrowed_date")
  private Instant borrowedDate;

  @Column(name = "due_date", nullable = false)
  private LocalDate dueDate;

  @Column(name = "returned_date")
  private Instant returnedDate;

  @Column(name = "picked_up_deadline", nullable = false)
  @Builder.Default
  private Instant pickedUpDeadline = Instant.now().plus(1, DAYS);

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private TransactionStatus status = TransactionStatus.WAITING_FOR_PICKUP;

  @Column(nullable = false)
  @Builder.Default
  private Integer renewalCount = 0;

  @Column(nullable = false, precision = 15, scale = 0)
  @Builder.Default
  private BigDecimal depositAmount = BigDecimal.ZERO;

  @Column(nullable = false, length = 30)
  @Builder.Default
  private String depositStatus = "NOT_REQUIRED";

  private Instant depositCollectedAt;

  private Long depositCollectedByLibrarianId;

  private Instant depositSettledAt;

  private Long depositSettledByLibrarianId;

  @Column(nullable = false, precision = 15, scale = 0)
  @Builder.Default
  private BigDecimal depositGrossFineAmount = BigDecimal.ZERO;

  @Column(nullable = false, precision = 15, scale = 0)
  @Builder.Default
  private BigDecimal depositAppliedAmount = BigDecimal.ZERO;

  @Column(nullable = false, precision = 15, scale = 0)
  @Builder.Default
  private BigDecimal depositRefundAmount = BigDecimal.ZERO;

  @Column(nullable = false, precision = 15, scale = 0)
  @Builder.Default
  private BigDecimal depositAdditionalAmountDue = BigDecimal.ZERO;

  public BorrowingTransactionEntity() {
    // Default constructor for JPA
  }
}
