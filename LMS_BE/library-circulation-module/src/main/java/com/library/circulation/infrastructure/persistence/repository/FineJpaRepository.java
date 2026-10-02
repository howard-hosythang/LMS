package com.library.circulation.infrastructure.persistence.repository;

import com.library.circulation.infrastructure.persistence.entity.FineEntity;
import com.library.circulation.domain.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface FineJpaRepository extends JpaRepository<FineEntity, Long> {
  @Override
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  Optional<FineEntity> findById(Long id);
  @Query("""
      SELECT COUNT(f) > 0
      FROM FineEntity f
      JOIN BorrowingTransactionEntity t ON t.id = f.transactionId
      WHERE t.userId = :userId AND f.paymentStatus = :paymentStatus
      """)
  boolean existsByUserIdAndPaymentStatus(
      @Param("userId") Long userId,
      @Param("paymentStatus") PaymentStatus paymentStatus);
}
