package com.library.circulation.infrastructure.persistence.entity;

import com.library.circulation.domain.enums.PaymentStatus;
import com.library.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * JPA Entity for Fine table.
 */
@Entity
@Table(name = "fines", indexes = {
    @Index(name = "idx_fine_transaction_id", columnList = "transactionId")
})
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
public class FineEntity extends BaseEntity {

  @Column(name = "transaction_id", nullable = false)
  private Long transactionId;

  @Column(nullable = false, precision = 15, scale = 0)
  private BigDecimal fineAmount;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

  private Instant paidDate;

  private Long paidByLibrarianId;

  @Enumerated(EnumType.STRING)
  @Column(length = 30)
  private com.library.user.domain.enums.ViolationType type;

}
