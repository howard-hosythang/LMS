package com.library.circulation.application.transaction;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import com.library.circulation.application.transaction.impl.ConfirmPickupUseCaseImpl;
import com.library.circulation.application.reservation.impl.ConfirmReservationPickupUseCaseImpl;
import com.library.circulation.domain.enums.ReservationStatus;
import com.library.circulation.domain.enums.TransactionStatus;
import com.library.circulation.infrastructure.persistence.entity.BorrowingTransactionEntity;
import com.library.circulation.infrastructure.persistence.entity.ReservationEntity;
import com.library.circulation.infrastructure.persistence.repository.BorrowingTransactionJpaRepository;
import com.library.circulation.infrastructure.persistence.repository.ReservationJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.port.ItemSnapshot;
import com.library.shared.port.ItemStatusPort;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PickupStateGuardTest {
    @Mock BorrowingTransactionJpaRepository transactionJpaRepository;
    @Mock ReservationJpaRepository reservationJpaRepository;
    @Mock ItemStatusPort itemStatusPort;
    @Mock EntityManager entityManager;
    @InjectMocks ConfirmPickupUseCaseImpl pickup;
    @InjectMocks ConfirmReservationPickupUseCaseImpl reservationPickup;

    void lockedCopy() {
        when(itemStatusPort.lockAndGet(1L)).thenReturn(new ItemSnapshot(1L, "RESERVED", 2L, "Book", "BC1", "CS1", "A1"));
    }

    @Test void expiredOnlineBorrowCannotBeHandedOverBeforeSchedulerRuns() {
        var entity = BorrowingTransactionEntity.builder().itemId(1L).status(TransactionStatus.WAITING_FOR_PICKUP)
            .pickedUpDeadline(Instant.now().minusSeconds(60)).build();
        when(transactionJpaRepository.findById(10L)).thenReturn(Optional.of(entity));
        lockedCopy();
        assertThatThrownBy(() -> pickup.execute(10L, 9L)).isInstanceOfSatisfying(AppException.class,
            error -> assertThat(error.getErrorCode()).isEqualTo(ErrorCode.PICKUP_DEADLINE_EXPIRED));
        verify(itemStatusPort, never()).updateStatus(any(), anyString());
    }

    @Test void expiredReservationCannotBeHandedOverBeforeSchedulerRuns() {
        var entity = ReservationEntity.builder().assignedItemId(1L).status(ReservationStatus.READY_FOR_PICKUP)
            .holdExpirationTime(Instant.now().minusSeconds(60)).build();
        when(reservationJpaRepository.findById(20L)).thenReturn(Optional.of(entity));
        lockedCopy();
        assertThatThrownBy(() -> reservationPickup.execute(20L, 9L)).isInstanceOfSatisfying(AppException.class,
            error -> assertThat(error.getErrorCode()).isEqualTo(ErrorCode.PICKUP_DEADLINE_EXPIRED));
        verify(itemStatusPort, never()).updateStatus(any(), anyString());
    }

    @Test void refreshedCancellationPreventsStaleOnlinePickup() {
        var entity = BorrowingTransactionEntity.builder().itemId(1L).status(TransactionStatus.WAITING_FOR_PICKUP).build();
        when(transactionJpaRepository.findById(10L)).thenReturn(Optional.of(entity));
        lockedCopy();
        doAnswer(inv -> { entity.setStatus(TransactionStatus.CANCELLED); return null; })
            .when(entityManager).refresh(entity, LockModeType.PESSIMISTIC_WRITE);
        assertThatThrownBy(() -> pickup.execute(10L, 9L)).isInstanceOf(AppException.class);
        verify(itemStatusPort, never()).updateStatus(any(), anyString());
    }

    @Test void refreshedExpiryPreventsStaleReservationPickup() {
        var entity = ReservationEntity.builder().assignedItemId(1L).status(ReservationStatus.READY_FOR_PICKUP).build();
        when(reservationJpaRepository.findById(20L)).thenReturn(Optional.of(entity));
        lockedCopy();
        doAnswer(inv -> { entity.setStatus(ReservationStatus.EXPIRED); return null; })
            .when(entityManager).refresh(entity, LockModeType.PESSIMISTIC_WRITE);
        assertThatThrownBy(() -> reservationPickup.execute(20L, 9L)).isInstanceOf(AppException.class);
        verify(itemStatusPort, never()).updateStatus(any(), anyString());
    }
}
