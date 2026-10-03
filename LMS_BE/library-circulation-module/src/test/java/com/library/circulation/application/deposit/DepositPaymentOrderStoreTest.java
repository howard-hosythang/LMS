package com.library.circulation.application.deposit;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import com.library.circulation.application.policy.CirculationPolicy;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.dto.request.DepositPaymentRequest;
import com.library.shared.exception.AppException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class DepositPaymentOrderStoreTest {
    @Mock NamedParameterJdbcTemplate jdbc;
    @Mock CirculationPolicyService policies;
    @InjectMocks DepositPaymentOrderStore store;
    CirculationPolicy policy(BigDecimal amount) { return new CirculationPolicy(48,14,5,3,1,2,BigDecimal.TEN,amount,false,null,null,null); }
    Map<String,Object> target() { return Map.of("user_id",7L,"item_id",1L,"student_id","00123"); }

    @ParameterizedTest @ValueSource(strings={"DIRECT","TRANSACTION","RESERVATION"})
    void createsDurableOrderWithPolicyAmountAndServerResolvedIdentity(String flow) {
        var request = new DepositPaymentRequest(flow,"00123","BC1",flow.equals("DIRECT") ? null : 10L);
        when(jdbc.queryForList(anyString(), any(MapSqlParameterSource.class))).thenReturn(List.of(target()),List.of());
        when(policies.getPolicy()).thenReturn(policy(new BigDecimal("50000")));
        doReturn(0L).when(jdbc).queryForObject(contains("COUNT(*)"), any(MapSqlParameterSource.class), eq(Long.class));
        when(jdbc.queryForObject(contains("nextval"), anyMap(), eq(Long.class))).thenReturn(2000000000000000L);
        when(jdbc.queryForList(anyString(), anyMap())).thenReturn(List.of(Map.of("order_code",2000000000000000L)));
        store.prepare(request,9L);
        var captured = ArgumentCaptor.forClass(MapSqlParameterSource.class);
        verify(jdbc).update(contains("'CREATING'"),captured.capture());
        assertThat(captured.getValue().getValue("userId")).isEqualTo(7L);
        assertThat(captured.getValue().getValue("itemId")).isEqualTo(1L);
        assertThat(captured.getValue().getValue("amount")).isEqualTo(new BigDecimal("50000"));
        assertThat(captured.getValue().getValue("description")).isEqualTo("LMS COC 00123");
        assertThat(captured.getValue().getValue("flow")).isEqualTo(flow);
    }
    @Test void reusesOpenOrderInsteadOfCreatingDuplicate() {
        when(jdbc.queryForList(anyString(), any(MapSqlParameterSource.class))).thenReturn(List.of(target()),
            List.of(Map.of("order_code",123L,"flow","DIRECT","status","PAID")));
        assertThat(store.prepare(new DepositPaymentRequest("DIRECT","00123","BC1",null),9L).get("order_code")).isEqualTo(123L);
        verifyNoInteractions(policies); verify(jdbc,never()).update(anyString(),any(MapSqlParameterSource.class));
    }
    @Test void refusesSameReaderCopyPaymentInDifferentFlow() {
        when(jdbc.queryForList(anyString(), any(MapSqlParameterSource.class))).thenReturn(List.of(target()),
            List.of(Map.of("order_code",123L,"flow","RESERVATION","source_id",20L,"status","PAID")));
        assertThatThrownBy(() -> store.prepare(new DepositPaymentRequest("DIRECT","00123","BC1",null),9L)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(policies); verify(jdbc,never()).update(anyString(),any(MapSqlParameterSource.class));
    }
    @Test void invalidOrExpiredTargetCannotTakeMoney() {
        when(jdbc.queryForList(anyString(), any(MapSqlParameterSource.class))).thenReturn(List.of());
        assertThatThrownBy(() -> store.prepare(new DepositPaymentRequest("RESERVATION",null,null,20L),9L)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(policies); verify(jdbc,never()).update(anyString(),any(MapSqlParameterSource.class));
    }
    @Test void unknownFlowFailsBeforeDatabaseAccess() {
        assertThatThrownBy(() -> store.prepare(new DepositPaymentRequest("OTHER",null,null,null),9L)).isInstanceOf(AppException.class);
        verifyNoInteractions(jdbc,policies);
    }
    @Test void zeroDepositCannotCreatePaymentLink() {
        when(jdbc.queryForList(anyString(), any(MapSqlParameterSource.class))).thenReturn(List.of(target()),List.of());
        when(policies.getPolicy()).thenReturn(policy(BigDecimal.ZERO));
        assertThatThrownBy(() -> store.prepare(new DepositPaymentRequest("DIRECT","00123","BC1",null),9L)).isInstanceOf(ResponseStatusException.class);
        verify(jdbc,never()).update(anyString(),any(MapSqlParameterSource.class));
    }
}
