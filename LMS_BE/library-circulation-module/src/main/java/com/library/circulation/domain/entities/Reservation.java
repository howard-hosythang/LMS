package com.library.circulation.domain.entities;

import com.library.catalog.domain.valueobject.PublicationId;
import com.library.circulation.domain.enums.ReservationStatus;
import com.library.circulation.domain.valueobject.ReservationId;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.user.domain.valueobject.UserId;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(access = AccessLevel.PRIVATE)
public class Reservation {

  private ReservationId id;
  private UserId userId;
  private PublicationId publicationId;

  private Instant reservationDate;
  private ReservationStatus status;
  private int queuePosition;
  private Instant holdExpirationTime;
  private String preferredBranch;
  private Long assignedItemId;

  private final List<Object> domainEvents = new ArrayList<>();

  public static Reservation create(
      UserId userId, PublicationId publicationId, String preferredBranch, int queuePosition) {
    return Reservation.builder()
        .id(ReservationId.generate())
        .userId(userId)
        .publicationId(publicationId)
        .preferredBranch(preferredBranch != null ? preferredBranch : "ANY")
        .queuePosition(queuePosition)
        .reservationDate(Instant.now())
        .status(ReservationStatus.PENDING)
        .build();
  }

  public void assign(Long itemId, Instant holdExpTime) {
    if (this.status != ReservationStatus.PENDING) {
      throw new AppException(ErrorCode.RESERVATION_NOT_CANCELLABLE);
    }
    this.assignedItemId = itemId;
    this.holdExpirationTime = holdExpTime;
    this.status = ReservationStatus.READY_FOR_PICKUP;
  }

  public void cancel() {
    if (this.status != ReservationStatus.PENDING && this.status != ReservationStatus.READY_FOR_PICKUP) {
      throw new AppException(ErrorCode.RESERVATION_NOT_CANCELLABLE);
    }
    this.status = ReservationStatus.CANCELLED;
  }

  public void complete() {
    this.status = ReservationStatus.COMPLETED;
  }

  private void addDomainEvent(Object event) {
    this.domainEvents.add(event);
  }

  public List<Object> pollDomainEvents() {
    List<Object> events = new ArrayList<>(this.domainEvents);
    this.domainEvents.clear();
    return events;
  }
}
