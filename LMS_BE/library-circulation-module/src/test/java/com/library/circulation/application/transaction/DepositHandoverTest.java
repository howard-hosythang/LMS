package com.library.circulation.application.transaction;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

import com.library.circulation.application.deposit.BorrowDepositService;
import com.library.circulation.application.policy.CirculationPolicy;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.application.reservation.impl.ConfirmReservationPickupUseCaseImpl;
import com.library.circulation.application.transaction.impl.ConfirmPickupUseCaseImpl;
import com.library.circulation.application.transaction.impl.DirectBorrowUseCaseImpl;
import com.library.circulation.domain.enums.ReservationStatus;
import com.library.circulation.domain.enums.TransactionStatus;
import com.library.circulation.dto.request.DirectBorrowCommand;
import com.library.circulation.infrastructure.persistence.entity.BorrowingTransactionEntity;
import com.library.circulation.infrastructure.persistence.entity.ReservationEntity;
import com.library.circulation.infrastructure.persistence.repository.BorrowingTransactionJpaRepository;
import com.library.circulation.infrastructure.persistence.repository.ReservationJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.port.ItemSnapshot;
import com.library.shared.port.ItemStatusPort;
import com.library.shared.port.UserInteractionPort;
import com.library.shared.service.LibrarianNotificationService;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;

@ExtendWith(MockitoExtension.class)
class DepositHandoverTest {
    @Mock ItemStatusPort itemStatusPort;
    @Mock BorrowingTransactionJpaRepository transactionJpaRepository;
    @Mock ReservationJpaRepository reservationJpaRepository;
    @Mock NamedParameterJdbcTemplate jdbcTemplate;
    @Mock KafkaTemplate<String, Object> kafkaTemplate;
    @Mock UserInteractionPort userInteractionPort;
    @Mock CirculationPolicyService policyService;
    @Mock LibrarianNotificationService librarianNotificationService;
    @Mock BorrowDepositService borrowDepositService;
    @Mock EntityManager entityManager;
    @InjectMocks DirectBorrowUseCaseImpl direct;
    @InjectMocks ConfirmPickupUseCaseImpl pickup;
    @InjectMocks ConfirmReservationPickupUseCaseImpl reservation;

    @ParameterizedTest
    @CsvSource({"direct,CASH", "direct,BANK_TRANSFER", "pickup,CASH", "pickup,BANK_TRANSFER", "reservation,CASH", "reservation,BANK_TRANSFER"})
    void everyHandoverPassesChosenMethodToCollection(String flow, String method) {
        var amount = new BigDecimal("50000");
        when(policyService.getPolicy()).thenReturn(new CirculationPolicy(48, 14, 5, 3, 1, 2,
            BigDecimal.TEN, amount, false, null, null, null));
        when(borrowDepositService.collectForBorrow(anyLong(), eq(9L), eq(amount), eq(method)))
            .thenReturn(BorrowDepositService.DepositSnapshot.builder().depositAmount(amount)
                .depositStatus("COLLECTED").depositPaymentMethod(method).build());
        var held = new ItemSnapshot(1L, "RESERVED", 2L, "Book", "BC1", "CS1", "A1");
        com.library.circulation.dto.response.BorrowTransactionResponse result;
        if (flow.equals("direct")) {
            when(jdbcTemplate.queryForList(anyString(), anyMap())).thenReturn(List.of(Map.of("id", 7L, "student_id", "00123", "full_name", "Reader")));
            when(itemStatusPort.lockAndGetByBarcode("BC1")).thenReturn(new ItemSnapshot(1L, "AVAILABLE", 2L, "Book", "BC1", "CS1", "A1"));
            result = direct.execute(9L, new DirectBorrowCommand("00123", "BC1", method));
        } else {
            when(itemStatusPort.lockAndGet(1L)).thenReturn(held);
            when(jdbcTemplate.queryForMap(anyString(), anyMap())).thenReturn(Map.of("full_name", "Reader", "student_id", "00123"));
            if (flow.equals("pickup")) {
                var transaction = BorrowingTransactionEntity.builder()
                    .userId(7L).itemId(1L).status(TransactionStatus.WAITING_FOR_PICKUP)
                    .dueDate(LocalDate.now().plusDays(14)).pickedUpDeadline(Instant.now().plusSeconds(3600)).build();
                transaction.setId(10L);
                when(transactionJpaRepository.findById(10L)).thenReturn(Optional.of(transaction));
                result = pickup.execute(10L, 9L, method);
            } else {
                var hold = ReservationEntity.builder()
                    .userId(7L).publicationId(2L).assignedItemId(1L).status(ReservationStatus.READY_FOR_PICKUP)
                    .holdExpirationTime(Instant.now().plusSeconds(3600)).build();
                hold.setId(20L);
                when(reservationJpaRepository.findById(20L)).thenReturn(Optional.of(hold));
                result = reservation.execute(20L, 9L, method);
            }
        }
        verify(borrowDepositService).collectForBorrow(anyLong(), eq(9L), eq(amount), eq(method));
        assertThat(result.getDepositPaymentMethod()).isEqualTo(method);
        assertThat(result.getDepositAmount()).isEqualByComparingTo(amount);
        assertThat(result.getStatus()).isEqualTo(TransactionStatus.BORROWING);
    }

    @Test void invalidDirectPaymentMethodFailsBeforeAnyWrites() {
        assertThatThrownBy(() -> direct.execute(9L, new DirectBorrowCommand("00123", "BC1", "CARD")))
            .isInstanceOf(AppException.class);
        verifyNoInteractions(jdbcTemplate, itemStatusPort, transactionJpaRepository, borrowDepositService, kafkaTemplate);
    }
}
