package com.library.circulation.infrastructure.payment;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class PayOsClientTest {
    static final long CODE = 2000000000000000L;
    PayOsClient client;
    MockRestServiceServer server;
    @BeforeEach void setup() {
        var builder = RestClient.builder().baseUrl("https://payos.test");
        server = MockRestServiceServer.bindTo(builder).build();
        client = new PayOsClient("https://payos.test", "test-client", "test-api-key", "test-checksum");
        ReflectionTestUtils.setField(client, "restClient", builder.build());
    }
    @Test void createsDepositQrWithCorrectItemAndSignedAmount() {
        server.expect(requestTo("https://payos.test/v2/payment-requests")).andExpect(method(HttpMethod.POST))
            .andExpect(header("x-client-id", "test-client")).andExpect(jsonPath("$.amount").value(50000))
            .andExpect(jsonPath("$.items[0].name").value("Library borrowing deposit"))
            .andExpect(jsonPath("$.description").value("LMS COC 00123")).andExpect(jsonPath("$.signature").isNotEmpty())
            .andRespond(withSuccess("""
                {"code":"00","data":{"orderCode":2000000000000000,"amount":50000,"paymentLinkId":"link","checkoutUrl":"https://pay.payos.vn/web/link","qrCode":"qr"}}
                """,MediaType.APPLICATION_JSON));
        var link=client.createPaymentLink(CODE,50000,"LMS COC 00123","Reader","Library borrowing deposit","https://lms.test/#/cancel","https://lms.test/#/return");
        assertThat(link.qrCode()).isEqualTo("qr"); server.verify();
    }
    @Test void existingFineCreateSignatureRemainsCompatible() {
        server.expect(requestTo("https://payos.test/v2/payment-requests"))
            .andExpect(jsonPath("$.items[0].name").value("Library fine payment (2 fines)"))
            .andRespond(withSuccess("{\"code\":\"00\",\"data\":{\"paymentLinkId\":\"fine-link\",\"checkoutUrl\":\"url\",\"qrCode\":\"fine-qr\"}}",MediaType.APPLICATION_JSON));
        assertThat(client.createPaymentLink(123L,50000,"LMS FINE 00123","Reader",2,"cancel","return").qrCode()).isEqualTo("fine-qr"); server.verify();
    }
    @Test void providerGetMapsIdAndActualAmountPaidWithoutRequiringQr() {
        server.expect(requestTo("https://payos.test/v2/payment-requests/"+CODE)).andExpect(method(HttpMethod.GET))
            .andRespond(withSuccess("""
                {"code":"00","data":{"id":"link","orderCode":2000000000000000,"amount":50000,"amountPaid":50000,"status":"PAID"}}
                """,MediaType.APPLICATION_JSON));
        var result=client.getPaymentDetails(CODE);
        assertThat(result.paymentLinkId()).isEqualTo("link"); assertThat(result.amountPaid()).isEqualTo(50000);
        assertThat(result.orderCode()).isEqualTo(CODE); assertThat(result.qrCode()).isNull(); server.verify();
    }
    @Test void existingFineStatusApiStillWorks() {
        server.expect(requestTo("https://payos.test/v2/payment-requests/123"))
            .andRespond(withSuccess("{\"code\":\"00\",\"data\":{\"id\":\"fine-link\",\"orderCode\":123,\"amount\":1000,\"status\":\"PAID\"}}",MediaType.APPLICATION_JSON));
        assertThat(client.getPaymentStatus(123L).status()).isEqualTo("PAID"); server.verify();
    }
    @Test void cancelUsesProviderCancelEndpoint() {
        server.expect(requestTo("https://payos.test/v2/payment-requests/"+CODE+"/cancel")).andExpect(method(HttpMethod.POST))
            .andRespond(withSuccess("{\"code\":\"00\",\"data\":{\"status\":\"CANCELLED\"}}",MediaType.APPLICATION_JSON));
        client.cancelPayment(CODE); server.verify();
    }
}
