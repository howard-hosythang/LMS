package com.library.circulation.application.reservation;

import static org.mockito.Mockito.*;
import com.library.circulation.application.reservation.impl.CancelReservationUseCaseImpl;
import com.library.circulation.application.reshelving.ReshelvingService;
import com.library.circulation.domain.enums.ReservationStatus;
import com.library.circulation.infrastructure.persistence.entity.ReservationEntity;
import com.library.circulation.infrastructure.persistence.repository.ReservationJpaRepository;
import com.library.circulation.infrastructure.service.ReservationAssignmentService;
import com.library.shared.port.ItemSnapshot;
import com.library.shared.port.ItemStatusPort;
import jakarta.persistence.EntityManager;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CancelReservationReshelvingTest {
    @Mock ReservationJpaRepository reservationJpaRepository;
    @Mock ItemStatusPort itemStatusPort;
    @Mock ReservationAssignmentService assignmentService;
    @Mock ReshelvingService reshelvingService;
    @Mock EntityManager entityManager;
    @InjectMocks CancelReservationUseCaseImpl useCase;

    ReservationEntity entity(ReservationStatus status) {
        var entity = ReservationEntity.builder().userId(7L).publicationId(2L).status(status)
            .assignedItemId(status == ReservationStatus.READY_FOR_PICKUP ? 1L : null).build();
        entity.setId(20L);
        when(reservationJpaRepository.findById(20L)).thenReturn(Optional.of(entity));
        return entity;
    }

    @Test void cancelPendingDoesNotCreatePhysicalShelvingWork() {
        entity(ReservationStatus.PENDING);
        useCase.execute(7L, 20L);
        verifyNoInteractions(itemStatusPort, assignmentService, reshelvingService);
    }

    @ParameterizedTest @ValueSource(booleans = {false, true})
    void cancelReadyOffersNextReaderBeforeShelving(boolean reassigned) {
        entity(ReservationStatus.READY_FOR_PICKUP);
        when(itemStatusPort.lockAndGet(1L)).thenReturn(new ItemSnapshot(1L, "RESERVED", 2L, "Book", "BC1", "CS1", "A1"));
        when(assignmentService.tryAssign(1L, 2L, "CS1")).thenReturn(reassigned);
        useCase.execute(7L, 20L);
        verify(itemStatusPort).updateStatus(1L, "AVAILABLE");
        if (reassigned) verifyNoInteractions(reshelvingService);
        else verify(reshelvingService).recordAvailable(1L, null, 20L, 7L, ReshelvingService.Source.RESERVATION_CANCELLED);
    }
}
