package com.library.circulation.application.deposit;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

import com.library.shared.exception.AppException;
import com.library.shared.service.AuditLogService;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

@ExtendWith(MockitoExtension.class)
class BorrowDepositServiceTest {
    @Mock NamedParameterJdbcTemplate jdbc;
    @Mock AuditLogService audit;
    @InjectMocks BorrowDepositService service;

    @ParameterizedTest
    @ValueSource(strings = {"CASH", "BANK_TRANSFER"})
    void persistsMethodOnTransactionAndCollectionEvent(String method) {
        var result = service.collectForBorrow(1L, 2L, new BigDecimal("50000"), method);
        assertThat(result.depositPaymentMethod()).isEqualTo(method);
        assertThat(result.depositStatus()).isEqualTo("COLLECTED");
        var params = ArgumentCaptor.forClass(MapSqlParameterSource.class);
        var sql = ArgumentCaptor.forClass(String.class);
        verify(jdbc, times(2)).update(sql.capture(), params.capture());
        assertThat(sql.getAllValues().get(0)).contains("deposit_payment_method = :paymentMethod");
        assertThat(sql.getAllValues().get(1)).contains("payment_method");
        assertThat(params.getAllValues()).allSatisfy(p -> assertThat(p.getValue("paymentMethod")).isEqualTo(method));
        assertThat(params.getAllValues().get(1).getValue("note")).asString()
            .contains(method.equals("CASH") ? "Tiền mặt" : "Chuyển khoản");
        verify(audit).log(eq(2L), anyString(), eq("COLLECT_BORROW_DEPOSIT"), anyString(), eq(1L), anyString(), argThat(m -> method.equals(m.get("paymentMethod"))));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {" ", "CASH"})
    void defaultsToCash(String method) {
        assertThat(service.collectForBorrow(1L, 2L, BigDecimal.ZERO, method).depositPaymentMethod()).isEqualTo("CASH");
        verify(jdbc).update(anyString(), any(MapSqlParameterSource.class));
        verifyNoInteractions(audit);
    }

    @Test void oldSignatureStillUsesCash() {
        assertThat(service.collectForBorrow(1L, 2L, BigDecimal.ZERO).depositPaymentMethod()).isEqualTo("CASH");
    }

    @Test void invalidMethodCannotWriteAnything() {
        assertThatThrownBy(() -> service.collectForBorrow(1L, 2L, BigDecimal.TEN, "CARD"))
            .isInstanceOf(AppException.class);
        verifyNoInteractions(jdbc, audit);
    }
}
