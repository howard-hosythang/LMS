package com.library.circulation.application.deposit;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.circulation.dto.request.DepositPaymentRequest;
import com.library.circulation.infrastructure.payment.PayOsClient;
import com.library.shared.service.AuditLogService;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class DepositPaymentServiceTest {
    static final Long CODE = 2000000000000000L;
    @Mock DepositPaymentOrderStore store;
    @Mock NamedParameterJdbcTemplate jdbc;
    @Mock PayOsClient client;
    @Mock AuditLogService audit;
    @Mock ObjectMapper mapper;
    @InjectMocks DepositPaymentService service;

    Map<String, Object> order(String status) {
        var row = new HashMap<String, Object>();
        row.putAll(Map.of("order_code", CODE, "status", status, "amount", new BigDecimal("50000"),
            "user_id", 7L, "item_id", 1L, "flow", "TRANSACTION", "source_id", 10L,
            "description", "LMS COC 00123", "student_id", "00123", "full_name", "Reader"));
        row.put("payment_link_id", "link"); row.put("qr_code", "qr"); row.put("checkout_url", "https://pay.payos.vn/link");
        return row;
    }
    PayOsClient.PayOsPaymentDetails remote(String status, Integer paid) {
        return new PayOsClient.PayOsPaymentDetails(CODE, "link", 50000, status, paid, "https://pay.payos.vn/link", "qr");
    }
    BigDecimal handover(Long code) { return service.resolveForHandover("BANK_TRANSFER", code, "TRANSACTION", 10L, 10L, 7L, 1L, new BigDecimal("60000"), 9L); }

    @Test void missingPaidOrderCannotHandover() {
        assertThatThrownBy(() -> handover(null)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(store, jdbc, audit);
    }
    @ParameterizedTest @ValueSource(strings={"CREATING", "PENDING", "CONSUMED", "CANCELLED", "EXPIRED"})
    void onlyPaidUnusedOrdersCanHandover(String status) {
        when(store.find(CODE, true)).thenReturn(order(status));
        assertThatThrownBy(() -> handover(CODE)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(jdbc, audit);
    }
    @ParameterizedTest @ValueSource(strings={"user_id", "item_id", "source_id", "flow"})
    void paidOrderMustMatchReaderCopyAndSource(String field) {
        var row=order("PAID"); row.put(field, field.equals("flow") ? "DIRECT" : 999L);
        when(store.find(CODE, true)).thenReturn(row);
        assertThatThrownBy(() -> handover(CODE)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(jdbc, audit);
    }
    @Test void consumesExactlyOnceAndHonorsAlreadyPaidQuoteWhenPolicyChanges() {
        when(store.find(CODE, true)).thenReturn(order("PAID"));
        when(jdbc.update(contains("consumed_transaction_id"), anyMap())).thenReturn(1);
        assertThat(handover(CODE)).isEqualByComparingTo("50000");
        verify(jdbc).update(contains("status='CONSUMED'"), argThat((Map<String, ?> p) -> p.get("transactionId").equals(10L) && p.get("code").equals(CODE)));
        when(store.find(CODE, true)).thenReturn(order("CONSUMED"));
        assertThatThrownBy(() -> handover(CODE)).isInstanceOf(ResponseStatusException.class);
        verify(jdbc, times(1)).update(anyString(), anyMap());
    }
    @Test void cashCannotDoubleChargeAnOpenPayOsOrder() {
        when(jdbc.queryForList(anyString(), anyMap())).thenReturn(List.of(Map.of("order_code", CODE)));
        assertThatThrownBy(() -> service.resolveForHandover("CASH", null, "DIRECT", null, 10L, 7L, 1L, BigDecimal.TEN, 9L)).isInstanceOf(ResponseStatusException.class);
        verify(jdbc, never()).update(anyString(), anyMap());
    }
    @Test void ordinaryCashAndZeroDepositStayCompatible() {
        assertThat(service.resolveForHandover("CASH", null, "DIRECT", null, 10L, 7L, 1L, BigDecimal.TEN, 9L)).isEqualByComparingTo("10");
        assertThat(service.resolveForHandover("BANK_TRANSFER", null, "DIRECT", null, 10L, 7L, 1L, BigDecimal.ZERO, 9L)).isZero();
        verifyNoInteractions(store, client, audit);
    }
    @Test void pendingSyncDoesNotCollectDepositOrHandOverBook() {
        when(store.find(CODE, true)).thenReturn(order("PENDING")); when(store.find(CODE, false)).thenReturn(order("PENDING"));
        when(client.getPaymentDetails(CODE)).thenReturn(remote("PENDING", 0));
        assertThat(service.sync(CODE, 9L).status()).isEqualTo("PENDING");
        verifyNoInteractions(jdbc, audit);
    }
    @Test void paidSyncRecordsPaymentNotBookHandover() {
        when(store.find(CODE, true)).thenReturn(order("PENDING")); when(store.find(CODE, false)).thenReturn(order("PAID"));
        when(client.getPaymentDetails(CODE)).thenReturn(remote("PAID", 50000));
        assertThat(service.sync(CODE, 9L).status()).isEqualTo("PAID");
        verify(jdbc).update(contains("paid_at=NOW()"), any(MapSqlParameterSource.class));
        verify(jdbc, never()).update(contains("borrowing_transactions"), anyMap());
    }
    @ParameterizedTest @ValueSource(ints={0, 49000, 51000})
    void rejectsUnderpaymentOrOverpayment(int amountPaid) {
        when(store.find(CODE, true)).thenReturn(order("PENDING")); when(client.getPaymentDetails(CODE)).thenReturn(remote("PAID", amountPaid));
        assertThatThrownBy(() -> service.sync(CODE, 9L)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(jdbc, audit);
    }
    @Test void rejectsMismatchedProviderOrderCode() {
        when(store.find(CODE, true)).thenReturn(order("PENDING"));
        when(client.getPaymentDetails(CODE)).thenReturn(new PayOsClient.PayOsPaymentDetails(123L, "link", 50000, "PAID", 50000, null, null));
        assertThatThrownBy(() -> service.sync(CODE, 9L)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(jdbc, audit);
    }
    @Test void repeatedPaidSyncIsIdempotent() {
        when(store.find(CODE, true)).thenReturn(order("PAID"));
        assertThat(service.sync(CODE, 9L).status()).isEqualTo("PAID");
        verifyNoInteractions(client, jdbc, audit);
    }
    @Test void reuseExistingQrWithoutCreatingNewLink() {
        var request = new DepositPaymentRequest("TRANSACTION", null, null, 10L);
        when(store.prepare(request, 9L)).thenReturn(order("PENDING"));
        assertThat(service.create(request, 9L).orderCode()).isEqualTo(CODE);
        verify(client, never()).createPaymentLink(anyLong(), anyInt(), anyString(), anyString(), anyString(), anyString(), anyString());
    }
    @Test void createsLinkWithDepositDescriptionNotFineDescription() {
        var request = new DepositPaymentRequest("TRANSACTION", null, null, 10L);
        when(store.prepare(request, 9L)).thenReturn(order("CREATING"));
        when(client.createPaymentLink(eq(CODE), eq(50000), eq("LMS COC 00123"), eq("Reader"), eq("Library borrowing deposit"), anyString(), anyString()))
            .thenReturn(new PayOsClient.PayOsPaymentLink("link", "https://pay.payos.vn/link", "qr"));
        when(store.find(CODE, false)).thenReturn(order("PENDING"));
        assertThat(service.create(request, 9L).qrCode()).isEqualTo("qr");
        verify(jdbc).update(contains("status=CASE"), any(MapSqlParameterSource.class));
    }
    @Test void timeoutRecoversSameOrderCode() {
        var request = new DepositPaymentRequest("TRANSACTION", null, null, 10L);
        when(store.prepare(request, 9L)).thenReturn(order("CREATING"));
        when(client.createPaymentLink(anyLong(), anyInt(), anyString(), anyString(), anyString(), anyString(), anyString())).thenThrow(new IllegalStateException("timeout"));
        when(client.getPaymentDetails(CODE)).thenReturn(remote("PENDING", 0)); when(store.find(CODE, false)).thenReturn(order("PENDING"));
        assertThat(service.create(request, 9L).orderCode()).isEqualTo(CODE);
    }
    @Test void failedProviderCallKeepsDurableOrderForRetry() {
        var request = new DepositPaymentRequest("TRANSACTION", null, null, 10L);
        when(store.prepare(request, 9L)).thenReturn(order("CREATING"));
        when(client.createPaymentLink(anyLong(), anyInt(), anyString(), anyString(), anyString(), anyString(), anyString())).thenThrow(new IllegalStateException("timeout"));
        when(client.getPaymentDetails(CODE)).thenThrow(new IllegalStateException("timeout"));
        assertThatThrownBy(() -> service.create(request, 9L)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(jdbc, audit);
    }
    @Test void timeoutRecoversHostedCheckoutEvenWhenProviderGetDoesNotReturnQr() {
        var request = new DepositPaymentRequest("TRANSACTION", null, null, 10L);
        when(store.prepare(request, 9L)).thenReturn(order("CREATING"));
        when(client.createPaymentLink(anyLong(), anyInt(), anyString(), anyString(), anyString(), anyString(), anyString())).thenThrow(new IllegalStateException("timeout"));
        when(client.getPaymentDetails(CODE)).thenReturn(new PayOsClient.PayOsPaymentDetails(CODE, "link", 50000, "PENDING", 0, null, null));
        when(store.find(CODE, false)).thenReturn(order("PENDING"));
        service.create(request, 9L);
        var params = org.mockito.ArgumentCaptor.forClass(MapSqlParameterSource.class);
        verify(jdbc).update(anyString(), params.capture());
        assertThat(params.getValue().getValue("url")).isEqualTo("https://pay.payos.vn/web/link");
        assertThat(params.getValue().getValue("qr")).isNull();
    }
    @Test void paidDepositCannotBeCancelled() {
        when(store.find(CODE, true)).thenReturn(order("PAID"));
        assertThatThrownBy(() -> service.cancel(CODE, 9L)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(client, jdbc);
    }
    @Test void partialTransferCannotBeCancelledOrSilentlyReplaced() {
        when(store.find(CODE, true)).thenReturn(order("PENDING")); when(client.getPaymentDetails(CODE)).thenReturn(remote("PENDING", 1000));
        assertThatThrownBy(() -> service.cancel(CODE, 9L)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(jdbc);
    }
    @Test void cancelRequiresProviderConfirmation() {
        when(store.find(CODE, true)).thenReturn(order("PENDING")); when(store.find(CODE, false)).thenReturn(order("CANCELLED"));
        when(client.getPaymentDetails(CODE)).thenReturn(remote("PENDING", 0), remote("CANCELLED", 0));
        assertThat(service.cancel(CODE, 9L).status()).isEqualTo("CANCELLED");
        verify(client).cancelPayment(CODE);
        verify(jdbc).update(contains("status=:status"), anyMap());
    }

    @Test void webhookRequiresValidSignatureBeforeChangingAnything() throws Exception {
        when(mapper.readValue(eq("body"), any(com.fasterxml.jackson.core.type.TypeReference.class))).thenReturn(Map.of("success", true));
        when(client.verifyWebhook(anyMap())).thenReturn(false);
        assertThatThrownBy(() -> service.webhook("body")).isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(jdbc, audit);
    }
    @Test void validFullPaymentWebhookMarksPaidButDoesNotHandOver() throws Exception {
        var payload = Map.of("success",true,"data",Map.of("code","00","orderCode",CODE,"amount",50000));
        when(mapper.readValue(eq("body"), any(com.fasterxml.jackson.core.type.TypeReference.class))).thenReturn(payload);
        when(client.verifyWebhook(anyMap())).thenReturn(true);
        when(jdbc.queryForList(anyString(),anyMap())).thenReturn(List.of(order("PENDING")));
        service.webhook("body");
        verify(jdbc).update(contains("status='PAID'"), any(MapSqlParameterSource.class));
        verify(jdbc,never()).update(contains("borrowing_transactions"), anyMap());
    }
    @Test void partialWebhookCannotMarkWholeDepositPaid() throws Exception {
        var payload = Map.of("success",true,"data",Map.of("code","00","orderCode",CODE,"amount",1000));
        when(mapper.readValue(eq("body"), any(com.fasterxml.jackson.core.type.TypeReference.class))).thenReturn(payload);
        when(client.verifyWebhook(anyMap())).thenReturn(true);
        when(jdbc.queryForList(anyString(),anyMap())).thenReturn(List.of(order("PENDING")));
        service.webhook("body");
        verify(jdbc,never()).update(anyString(), any(MapSqlParameterSource.class)); verifyNoInteractions(audit);
    }
    @Test void repeatedWebhookCannotCollectDepositTwice() throws Exception {
        var payload = Map.of("success",true,"data",Map.of("code","00","orderCode",CODE,"amount",50000));
        when(mapper.readValue(eq("body"), any(com.fasterxml.jackson.core.type.TypeReference.class))).thenReturn(payload);
        when(client.verifyWebhook(anyMap())).thenReturn(true);
        when(jdbc.queryForList(anyString(),anyMap())).thenReturn(List.of(order("CONSUMED")));
        service.webhook("body");
        verify(jdbc,never()).update(anyString(), any(MapSqlParameterSource.class)); verifyNoInteractions(audit);
    }
    @Test void missingConfigurationCannotLeaveAnOrphanedCreatingOrder() {
        doThrow(new IllegalStateException("not configured")).when(client).ensureConfigured();
        assertThatThrownBy(() -> service.create(new DepositPaymentRequest("DIRECT", "00123", "BC1", null), 9L))
            .isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(store, jdbc, audit);
    }
    @Test void unknownReceivedAmountCannotBeTreatedAsUnpaidOnCancellation() {
        when(store.find(CODE, true)).thenReturn(order("PENDING")); when(client.getPaymentDetails(CODE)).thenReturn(remote("PENDING", null));
        assertThatThrownBy(() -> service.cancel(CODE, 9L)).isInstanceOf(ResponseStatusException.class);
        verify(client,never()).cancelPayment(CODE); verifyNoInteractions(jdbc);
    }
}
