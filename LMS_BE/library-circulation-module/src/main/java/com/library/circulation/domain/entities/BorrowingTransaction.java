package com.library.circulation.domain.entities;

import com.library.catalog.domain.valueobject.ItemId;
import com.library.circulation.domain.enums.TransactionStatus;
import com.library.circulation.domain.valueobject.TransactionId;
import com.library.shared.exception.AppException;
import com.library.shared.exception.DomainException;
import com.library.shared.exception.ErrorCode;
import com.library.user.domain.valueobject.UserId;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder(access = AccessLevel.PRIVATE)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class BorrowingTransaction {

  private final TransactionId id;
  private final UserId userId;
  private final ItemId itemId;

  private UserId librarianIdIssue;
  private UserId librarianIdReturn;

  private Instant borrowedDate;
  private LocalDate dueDate;
  private Instant returnedDate;
  private Instant pickedUpDeadline;

  private TransactionStatus status;
  private int renewalCount;

  @Builder.Default
  private final List<Object> domainEvents = new ArrayList<>();

  // ── Factories ──────────────────────────────────────────────

  public static BorrowingTransaction createBorrowRequest(
      UserId userId, ItemId itemId, Instant pickupDeadline, LocalDate initialDueDate) {
    return BorrowingTransaction.builder()
        .id(TransactionId.generate())
        .userId(userId)
        .itemId(itemId)
        .pickedUpDeadline(pickupDeadline)
        .dueDate(initialDueDate)
        .status(TransactionStatus.WAITING_FOR_PICKUP)
        .renewalCount(0)
        .build();
  }

  public static BorrowingTransaction of(
      TransactionId id, UserId userId, ItemId itemId,
      UserId librarianIdIssue, UserId librarianIdReturn,
      Instant borrowedDate, LocalDate dueDate, Instant returnedDate,
      Instant pickedUpDeadline, TransactionStatus status, int renewalCount) {
    return BorrowingTransaction.builder()
        .id(id).userId(userId).itemId(itemId)
        .librarianIdIssue(librarianIdIssue).librarianIdReturn(librarianIdReturn)
        .borrowedDate(borrowedDate).dueDate(dueDate).returnedDate(returnedDate)
        .pickedUpDeadline(pickedUpDeadline).status(status).renewalCount(renewalCount)
        .build();
  }

  public static BorrowingTransaction createDirectBorrow(
      UserId userId, ItemId itemId, UserId librarianId, LocalDate dueDate) {
    return BorrowingTransaction.builder()
        .id(TransactionId.generate())
        .userId(userId)
        .itemId(itemId)
        .librarianIdIssue(librarianId)
        .borrowedDate(Instant.now())
        .dueDate(dueDate)
        .pickedUpDeadline(Instant.now())
        .status(TransactionStatus.BORROWING)
        .renewalCount(0)
        .build();
  }

  // ── Domain behaviour ───────────────────────────────────────

  public void confirmPickup(UserId librarianId, LocalDate actualDueDate) {
    if (this.status != TransactionStatus.WAITING_FOR_PICKUP) {
      throw new DomainException("Transaction must be WAITING_FOR_PICKUP to confirm pickup");
    }
    this.librarianIdIssue = librarianId;
    this.borrowedDate = Instant.now();
    this.dueDate = actualDueDate;
    this.status = TransactionStatus.BORROWING;
  }

  public void cancel() {
    if (this.status != TransactionStatus.WAITING_FOR_PICKUP) {
      throw new DomainException("Only WAITING_FOR_PICKUP transactions can be cancelled");
    }
    this.status = TransactionStatus.CANCELLED;
  }

  public void processReturn(UserId librarianId, Instant returnedAt) {
    if (this.status != TransactionStatus.BORROWING && this.status != TransactionStatus.OVERDUE) {
      throw new AppException(ErrorCode.TRANSACTION_NOT_RETURNABLE);
    }
    this.status = TransactionStatus.RETURNED;
    this.returnedDate = returnedAt;
    this.librarianIdReturn = librarianId;
  }

  public boolean isOverdue(LocalDate today) {
    return dueDate != null && today.isAfter(dueDate);
  }

  // ── Domain events ──────────────────────────────────────────

  private void addDomainEvent(Object event) {
    this.domainEvents.add(event);
  }

  public List<Object> pollDomainEvents() {
    List<Object> events = new ArrayList<>(this.domainEvents);
    this.domainEvents.clear();
    return events;
  }
}
