package com.library.circulation.application.transaction;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import com.library.circulation.application.transaction.impl.RestoreLostBookUseCaseImpl;
import com.library.circulation.application.reshelving.ReshelvingService;
import com.library.circulation.infrastructure.service.ReservationAssignmentService;
import com.library.circulation.infrastructure.persistence.entity.BorrowingTransactionEntity;
import com.library.circulation.infrastructure.persistence.repository.BorrowingTransactionJpaRepository;
import com.library.circulation.dto.request.RestoreLostBookCommand;
import com.library.shared.port.ItemSnapshot;
import com.library.shared.port.ItemStatusPort;
import com.library.shared.service.AuditLogService;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;

@ExtendWith(MockitoExtension.class)
class RestoreLostReshelvingTest {
    @Mock ItemStatusPort itemStatusPort;
    @Mock BorrowingTransactionJpaRepository transactionJpaRepository;
    @Mock NamedParameterJdbcTemplate jdbcTemplate;
    @Mock KafkaTemplate<String, Object> kafkaTemplate;
    @Mock AuditLogService auditLogService;
    @Mock ReshelvingService reshelvingService;
    @Mock ReservationAssignmentService reservationAssignmentService;
    @InjectMocks RestoreLostBookUseCaseImpl useCase;

    void lostCopy() {
        var entity = BorrowingTransactionEntity.builder().itemId(1L).userId(7L).build();
        entity.setId(10L);
        when(transactionJpaRepository.findById(10L)).thenReturn(Optional.of(entity));
        when(itemStatusPort.lockAndGet(1L)).thenReturn(new ItemSnapshot(1L, "LOST", 2L, "Book", "BC1", "CS1", "A1"));
        when(jdbcTemplate.queryForList(anyString(), anyMap())).thenReturn(List.of(Map.of("id", 30L, "fine_amount", BigDecimal.TEN)));
    }

    @ParameterizedTest @ValueSource(booleans = {false, true})
    void availableRecoveryOffersReservationBeforeQueuing(boolean reassigned) {
        lostCopy();
        when(reservationAssignmentService.tryAssign(1L, 2L, "CS1")).thenReturn(reassigned);
        var result = useCase.execute(10L, 9L, new RestoreLostBookCommand("BC1", "AVAILABLE", BigDecimal.ZERO, "READER_FOUND", null));
        assertThat(result.itemStatus()).isEqualTo(reassigned ? "RESERVED" : "AVAILABLE");
        if (reassigned) verifyNoInteractions(reshelvingService);
        else verify(reshelvingService).recordAvailable(1L, 10L, null, 7L, ReshelvingService.Source.LOST_RECOVERED);
    }

    @Test void recoveredDamagedCopyStaysInMaintenanceNotShelvingQueue() {
        lostCopy();
        useCase.execute(10L, 9L, new RestoreLostBookCommand("BC1", "IN_MAINTENANCE", BigDecimal.ZERO, "READER_FOUND", null));
        verify(itemStatusPort).updateStatus(1L, "IN_MAINTENANCE");
        verifyNoInteractions(reservationAssignmentService, reshelvingService);
    }
}
