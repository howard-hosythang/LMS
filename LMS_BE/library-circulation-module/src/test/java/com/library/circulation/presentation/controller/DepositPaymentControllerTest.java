package com.library.circulation.presentation.controller;

import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.library.circulation.application.deposit.DepositPaymentService;
import com.library.circulation.dto.request.DepositPaymentRequest;
import com.library.shared.util.SecurityEvaluator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class DepositPaymentControllerTest {
    @Mock DepositPaymentService service;
    @Mock SecurityEvaluator security;
    @InjectMocks DepositPaymentController controller;
    MockMvc mvc;
    @BeforeEach void setup() { mvc=MockMvcBuilders.standaloneSetup(controller).build(); }
    @Test void createPassesIdentityAndAuthenticatedLibrarian() throws Exception {
        when(security.getCurrentUserId()).thenReturn(9L);
        mvc.perform(post("/api/v1/deposits/payments/payos").contentType(MediaType.APPLICATION_JSON)
            .content("{\"flow\":\"DIRECT\",\"studentId\":\"00123\",\"barcode\":\"BC1\"}")).andExpect(status().isOk());
        verify(service).create(eq(new DepositPaymentRequest("DIRECT","00123","BC1",null)),eq(9L));
    }
    @Test void syncPreservesLargeSafeOrderCode() throws Exception {
        when(security.getCurrentUserId()).thenReturn(9L);
        mvc.perform(post("/api/v1/deposits/payments/payos/2000000000000000/sync")).andExpect(status().isOk());
        verify(service).sync(2000000000000000L,9L);
    }
    @Test void cancelPassesAuthenticatedLibrarian() throws Exception {
        when(security.getCurrentUserId()).thenReturn(9L);
        mvc.perform(post("/api/v1/deposits/payments/payos/2000000000000000/cancel")).andExpect(status().isOk());
        verify(service).cancel(2000000000000000L,9L);
    }
}
