package com.library.circulation.application.fine;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

import com.library.circulation.application.fine.impl.UpdateFineAmountUseCaseImpl;
import com.library.circulation.dto.request.UpdateFineAmountRequest;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.service.AuditLogService;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

@ExtendWith(MockitoExtension.class)
class UpdateFineAmountUseCaseTest {
    @Mock NamedParameterJdbcTemplate jdbc;
    @Mock AuditLogService audit;
    @InjectMocks UpdateFineAmountUseCaseImpl useCase;

    private void fine(String status) {
        when(jdbc.queryForList(anyString(), anyMap())).thenReturn(List.of(Map.of(
            "id", 1L, "transaction_id", 2L, "fine_amount", new BigDecimal("1000000"), "payment_status", status)));
    }

    @Test void updatesUnpaidFineAndDebtAndRecordsOldAndNewAmounts() {
        fine("UNPAID");
        when(jdbc.queryForObject(anyString(), anyMap(), eq(Boolean.class))).thenReturn(false);
        assertThat(useCase.execute(1L, 3L, new UpdateFineAmountRequest(new BigDecimal("100000"), "Nhập nhầm")))
            .isEqualByComparingTo("100000");
        verify(jdbc).update(contains("UPDATE fines"), eq(Map.of("fineId", 1L, "amount", new BigDecimal("100000"))));
        verify(jdbc).queryForObject(contains("borrowing_transactions WHERE id = :transactionId FOR UPDATE"),
            eq(Map.of("transactionId", 2L)), eq(Long.class));
        verify(jdbc).update(contains("deposit_gross_fine_amount"), eq(Map.of("transactionId", 2L, "delta", new BigDecimal("-900000"))));
        verify(audit).log(eq(3L), eq("LIBRARIAN"), eq("UPDATE_FINE_AMOUNT"), eq("fines"), eq(1L), anyString(),
            eq(Map.of("transactionId", 2L, "oldAmount", new BigDecimal("1000000"), "newAmount", new BigDecimal("100000"), "reason", "Nhập nhầm")));
    }

    @Test void rejectsPaidFineWithoutWriting() {
        fine("PAID");
        assertError(ErrorCode.FINE_ALREADY_PAID, "100000");
        verify(jdbc, never()).update(anyString(), anyMap());
        verifyNoInteractions(audit);
    }

    @ParameterizedTest @ValueSource(strings = {"-1", "0", "10000001", "1.5"})
    void rejectsInvalidAmountsBeforeReading(String amount) {
        assertError(ErrorCode.INVALID_INPUT, amount);
        verifyNoInteractions(jdbc, audit);
    }

    @Test void rejectsFineInPendingQrOrder() {
        fine("UNPAID");
        when(jdbc.queryForObject(anyString(), anyMap(), eq(Boolean.class))).thenReturn(true);
        assertError(ErrorCode.FINE_PAYMENT_IN_PROGRESS, "100000");
        verify(jdbc, never()).update(anyString(), anyMap());
        verifyNoInteractions(audit);
    }

    @Test void rejectsMissingFine() {
        when(jdbc.queryForList(anyString(), anyMap())).thenReturn(List.of());
        assertError(ErrorCode.FINE_NOT_FOUND, "100000");
    }

    private void assertError(ErrorCode code, String amount) {
        assertThatThrownBy(() -> useCase.execute(1L, 3L, new UpdateFineAmountRequest(new BigDecimal(amount), null)))
            .isInstanceOf(AppException.class).extracting(e -> ((AppException) e).getErrorCode()).isEqualTo(code);
    }
}
