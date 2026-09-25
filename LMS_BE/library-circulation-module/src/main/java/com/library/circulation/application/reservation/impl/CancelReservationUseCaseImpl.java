package com.library.circulation.application.reservation.impl;

import com.library.circulation.application.reservation.CancelReservationUseCase;
import com.library.circulation.domain.enums.ReservationStatus;
import com.library.circulation.infrastructure.persistence.entity.ReservationEntity;
import com.library.circulation.infrastructure.persistence.repository.ReservationJpaRepository;
import com.library.circulation.infrastructure.service.ReservationAssignmentService;
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

    @Override
    @Transactional
    public void execute(Long userId, Long reservationId) {
        ReservationEntity entity = reservationJpaRepository.findById(reservationId)
            .orElseThrow(() -> new AppException(ErrorCode.RESERVATION_NOT_FOUND));

        if (!entity.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.NOT_OWNER);
        }

        if (entity.getStatus() != ReservationStatus.PENDING
            && entity.getStatus() != ReservationStatus.READY_FOR_PICKUP) {
            throw new AppException(ErrorCode.RESERVATION_NOT_CANCELLABLE);
        }

        boolean wasReadyForPickup = entity.getStatus() == ReservationStatus.READY_FOR_PICKUP;
        Long freedItemId = entity.getAssignedItemId();

        entity.setStatus(ReservationStatus.CANCELLED);
        if (wasReadyForPickup) entity.setAssignedItemId(null);
        reservationJpaRepository.save(entity);

        if (wasReadyForPickup && freedItemId != null) {
            // Release assigned item then check if next in queue can take it
            com.library.shared.port.ItemSnapshot item = itemStatusPort.lockAndGet(freedItemId);
            itemStatusPort.updateStatus(freedItemId, "AVAILABLE");
            assignmentService.tryAssign(freedItemId, item.publicationId(), item.branch());
        }

        log.info("Reservation cancelled: id={}, userId={}", reservationId, userId);
    }
}
