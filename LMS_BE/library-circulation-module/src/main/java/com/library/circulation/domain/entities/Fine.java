package com.library.circulation.domain.entities;

import com.library.circulation.domain.enums.PaymentStatus;
import com.library.circulation.domain.valueobject.FineId;
import com.library.circulation.domain.valueobject.TransactionId;
import java.math.BigDecimal;
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
public class Fine {

  // Identity
  private FineId id;
  private TransactionId transactionId;

  // Fine details
  private BigDecimal fineAmount;
  private Instant createAt;
  private PaymentStatus status;
  private Instant paidDate;
  private com.library.user.domain.enums.ViolationType type;

  // Domain events
  private final List<Object> domainEvents = new ArrayList<>();

  // ============== Domain Events Management ==============

  private void addDomainEvent(Object event) {
    this.domainEvents.add(event);
  }

  public List<Object> pollDomainEvents() {
    List<Object> events = new ArrayList<>(this.domainEvents);
    this.domainEvents.clear();
    return events;
  }
}
