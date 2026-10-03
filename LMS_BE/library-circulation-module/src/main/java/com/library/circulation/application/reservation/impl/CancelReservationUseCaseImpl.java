package com.library.circulation.application.reservation.impl;

import com.library.circulation.application.reservation.CancelReservationUseCase;
import com.library.circulation.domain.enums.ReservationStatus;
import com.library.circulation.infrastructure.persistence.entity.ReservationEntity;
import com.library.circulation.infrastructure.persistence.repository.ReservationJpaRepository;
import com.library.circulation.infrastructure.service.ReservationAssignmentService;
import com.library.circulation.application.reshelving.ReshelvingService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CancelReservationUseCaseImpl implements CancelReservationUseCase {

    private final ReservationJpaRepository reservationJpaRepository;
    private final com.library.shared.port.ItemStatusPort itemStatusPort;
    private final ReservationAssignmentService assignmentService;
    private final ReshelvingService reshelvingService;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public void execute(Long userId, Long reservationId) {
        ReservationEntity entity = reservationJpaRepository.findById(reservationId)
            .orElseThrow(() -> new AppException(ErrorCode.RESERVATION_NOT_FOUND));

        if (!entity.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.NOT_OWNER);
        }

        // Consistent copy -> reservation lock order. Refresh after waiting for the
        // copy so pickup/expiry cannot leave this operation with stale JPA state.
        com.library.shared.port.ItemSnapshot item = entity.getAssignedItemId() == null ? null
            : itemStatusPort.lockAndGet(entity.getAssignedItemId());
        entityManager.refresh(entity, LockModeType.PESSIMISTIC_WRITE);

        if (entity.getStatus() != ReservationStatus.PENDING
            && entity.getStatus() != ReservationStatus.READY_FOR_PICKUP) {
            throw new AppException(ErrorCode.RESERVATION_NOT_CANCELLABLE);
        }

        boolean wasReadyForPickup = entity.getStatus() == ReservationStatus.READY_FOR_PICKUP;
        Long freedItemId = entity.getAssignedItemId();

        entity.setStatus(ReservationStatus.CANCELLED);
        if (wasReadyForPickup) entity.setAssignedItemId(null);
        reservationJpaRepository.saveAndFlush(entity);

        if (wasReadyForPickup && freedItemId != null) {
            // Release assigned item then check if next in queue can take it
            if (item == null || !item.id().equals(freedItemId) || !"RESERVED".equals(item.status())) {
                throw new AppException(ErrorCode.RESERVATION_NOT_CANCELLABLE);
            }
            itemStatusPort.updateStatus(freedItemId, "AVAILABLE");
            boolean reassigned = assignmentService.tryAssign(freedItemId, item.publicationId(), item.branch());
            if (!reassigned) reshelvingService.recordAvailable(freedItemId, null, reservationId, userId,
                ReshelvingService.Source.RESERVATION_CANCELLED);
        }

        log.info("Reservation cancelled: id={}, userId={}", reservationId, userId);
    }
}
