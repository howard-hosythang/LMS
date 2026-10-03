package com.library.circulation.infrastructure.scheduler;

import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import com.library.circulation.application.reshelving.ReshelvingService;
import com.library.circulation.infrastructure.service.ReservationAssignmentService;
import com.library.shared.port.ItemSnapshot;
import com.library.shared.port.ItemStatusPort;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.kafka.core.KafkaTemplate;

@ExtendWith(MockitoExtension.class)
class ExpiredHoldReshelvingTest {
    @Mock NamedParameterJdbcTemplate jdbcTemplate;
    @Mock ItemStatusPort itemStatusPort;
    @Mock KafkaTemplate<String, Object> kafkaTemplate;
    @Mock ReservationAssignmentService assignmentService;
    @Mock ReshelvingService reshelvingService;
    @InjectMocks ExpiredPickupScheduler pickup;
    @InjectMocks ExpiredReservationScheduler reservation;

    void snapshot(String itemStatus) {
        when(jdbcTemplate.queryForList(anyString(), anyMap())).thenReturn(List.of(Map.of(
            "transaction_id", 10L, "reservation_id", 20L, "assigned_item_id", 1L,
            "item_id", 1L, "user_id", 7L, "publication_id", 2L,
            "publication_title", "Book", "branch", "CS1")));
        when(itemStatusPort.lockAndGet(1L)).thenReturn(new ItemSnapshot(1L, itemStatus, 2L, "Book", "BC1", "CS1", "A1"));
    }

    @ParameterizedTest @ValueSource(booleans = {false, true})
    void expiredBorrowQueuesOnlyWhenNoNextReservation(boolean reassigned) {
        snapshot("RESERVED");
        when(jdbcTemplate.update(contains("picked_up_deadline < NOW()"), any(SqlParameterSource.class))).thenReturn(1);
        when(assignmentService.tryAssign(1L, 2L, "CS1")).thenReturn(reassigned);
        pickup.cancelExpiredPickups();
        verify(itemStatusPort).updateStatus(1L, "AVAILABLE");
        verify(assignmentService).tryAssign(1L, 2L, "CS1");
        if (reassigned) verifyNoInteractions(reshelvingService);
        else verify(reshelvingService).recordAvailable(1L, 10L, null, 7L, ReshelvingService.Source.PICKUP_EXPIRED);
    }

    @ParameterizedTest @ValueSource(booleans = {false, true})
    void expiredReservationQueuesOnlyWhenNoNextReservation(boolean reassigned) {
        snapshot("RESERVED");
        when(jdbcTemplate.update(contains("hold_expiration_time < NOW()"), any(SqlParameterSource.class))).thenReturn(1);
        when(assignmentService.tryAssign(1L, 2L, "CS1")).thenReturn(reassigned);
        reservation.expireReservations();
        verify(itemStatusPort).updateStatus(1L, "AVAILABLE");
        if (reassigned) verifyNoInteractions(reshelvingService);
        else verify(reshelvingService).recordAvailable(1L, null, 20L, 7L, ReshelvingService.Source.RESERVATION_EXPIRED);
    }

    @ParameterizedTest @ValueSource(booleans = {false, true})
    void staleSchedulerSnapshotCannotReleaseAlreadyBorrowedCopy(boolean isReservation) {
        snapshot("BORROWED");
        if (isReservation) reservation.expireReservations(); else pickup.cancelExpiredPickups();
        verify(itemStatusPort, never()).updateStatus(any(), anyString());
        verify(jdbcTemplate, never()).update(anyString(), any(SqlParameterSource.class));
        verifyNoInteractions(assignmentService, reshelvingService, kafkaTemplate);
    }

    @ParameterizedTest @ValueSource(booleans = {false, true})
    void alreadyProcessedOrExtendedDeadlineDoesNotReleaseCopy(boolean isReservation) {
        snapshot("RESERVED");
        // Conditional UPDATE returns zero after another request changed status/deadline.
        if (isReservation) reservation.expireReservations(); else pickup.cancelExpiredPickups();
        verify(itemStatusPort, never()).updateStatus(any(), anyString());
        verifyNoInteractions(assignmentService, reshelvingService, kafkaTemplate);
    }
}
