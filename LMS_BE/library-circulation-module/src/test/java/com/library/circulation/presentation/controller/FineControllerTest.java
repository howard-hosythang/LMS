package com.library.circulation.presentation.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.library.circulation.application.fine.FinePaymentService;
import com.library.circulation.application.fine.GetMyFinesUseCase;
import com.library.circulation.application.fine.GetStudentFinesUseCase;
import com.library.circulation.application.fine.PayAllFinesUseCase;
import com.library.circulation.application.fine.PayFineUseCase;
import com.library.circulation.domain.enums.PaymentStatus;
import com.library.circulation.dto.response.FinePaymentLinkResponse;
import com.library.circulation.dto.response.FineResponse;
import com.library.circulation.dto.response.StudentFinesResponse;
import com.library.shared.dto.PageResponse;
import com.library.shared.util.SecurityEvaluator;
import com.library.user.domain.enums.ViolationType;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
@DisplayName("FineController — MockMvc")
class FineControllerTest {

    private static final Long USER_ID = 4L;

    @Mock private GetStudentFinesUseCase getStudentFinesUseCase;
    @Mock private GetMyFinesUseCase getMyFinesUseCase;
    @Mock private PayFineUseCase payFineUseCase;
    @Mock private PayAllFinesUseCase payAllFinesUseCase;
    @Mock private FinePaymentService finePaymentService;
    @Mock private SecurityEvaluator security;

    @InjectMocks private FineController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /fines/student returns unpaid fines for selected student")
    void getStudentFines_shouldReturnStudentFines() throws Exception {
        FineResponse fine = fine(10L, PaymentStatus.UNPAID);
        when(getStudentFinesUseCase.execute("22520001"))
            .thenReturn(StudentFinesResponse.builder()
                .studentId("22520001")
                .fullName("Nguyen Van A")
                .totalUnpaidAmount(new BigDecimal("80000"))
                .fines(List.of(fine))
                .build());

        mockMvc.perform(get("/api/v1/fines/student")
                .param("studentId", "22520001"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.studentId").value("22520001"))
            .andExpect(jsonPath("$.data.totalUnpaidAmount").value(80000))
            .andExpect(jsonPath("$.data.fines[0].fineId").value("10"));
    }

    @Test
    @DisplayName("PUT /fines/{id}/pay marks one fine paid")
    void payFine_shouldReturnPaidFine() throws Exception {
        when(security.getCurrentUserId()).thenReturn(USER_ID);
        when(payFineUseCase.execute(10L, USER_ID)).thenReturn(fine(10L, PaymentStatus.PAID));

        mockMvc.perform(put("/api/v1/fines/{id}/pay", 10L))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.fineId").value("10"))
            .andExpect(jsonPath("$.data.status").value("PAID"));

        verify(payFineUseCase).execute(10L, USER_ID);
    }

    @Test
    @DisplayName("POST /fines/payments/cash returns paid count")
    void payAllFinesByCash_shouldReturnPaidCount() throws Exception {
        when(security.getCurrentUserId()).thenReturn(USER_ID);
        when(payAllFinesUseCase.execute("22520001", USER_ID)).thenReturn(2);

        mockMvc.perform(post("/api/v1/fines/payments/cash")
                .param("studentId", "22520001"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Cash payment recorded"))
            .andExpect(jsonPath("$.data.paidCount").value(2));
    }

    @Test
    @DisplayName("POST /fines/payments/payos creates payment link")
    void createPayOsFinePayment_shouldReturnPaymentLink() throws Exception {
        when(security.getCurrentUserId()).thenReturn(USER_ID);
        when(finePaymentService.createPayOsPaymentLink("22520001", USER_ID))
            .thenReturn(FinePaymentLinkResponse.builder()
                .orderCode(123456L)
                .paymentLinkId("payos-link-id")
                .checkoutUrl("https://pay.payos.vn/checkout")
                .qrCode("qr-data")
                .description("Library fines")
                .amount(new BigDecimal("80000"))
                .fineCount(2)
                .studentId("22520001")
                .fullName("Nguyen Van A")
                .build());

        mockMvc.perform(post("/api/v1/fines/payments/payos")
                .param("studentId", "22520001"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("payOS payment link created"))
            .andExpect(jsonPath("$.data.orderCode").value(123456))
            .andExpect(jsonPath("$.data.checkoutUrl").value("https://pay.payos.vn/checkout"))
            .andExpect(jsonPath("$.data.fineCount").value(2));
    }

    @Test
    @DisplayName("POST /fines/payments/payos/{orderCode}/sync returns paid count")
    void syncPayOsFinePayment_shouldReturnPaidCount() throws Exception {
        when(security.getCurrentUserId()).thenReturn(USER_ID);
        when(finePaymentService.syncPayOsPayment(123456L, USER_ID)).thenReturn(2);

        mockMvc.perform(post("/api/v1/fines/payments/payos/{orderCode}/sync", 123456L))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.paidCount").value(2));
    }

    @Test
    @DisplayName("GET /fines/my-fines gets current user's fines")
    void getMyFines_shouldUseCurrentUser() throws Exception {
        PageResponse<FineResponse> page = PageResponse.<FineResponse>builder()
            .content(List.of(fine(10L, PaymentStatus.UNPAID)))
            .currentPage(0)
            .pageSize(10)
            .totalElements(1)
            .totalPages(1)
            .isFirst(true)
            .isLast(true)
            .build();
        when(security.getCurrentUserId()).thenReturn(USER_ID);
        when(getMyFinesUseCase.execute(USER_ID, "UNPAID", 0, 10)).thenReturn(page);

        mockMvc.perform(get("/api/v1/fines/my-fines")
                .param("status", "UNPAID")
                .param("page", "0")
                .param("size", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content[0].fineId").value("10"))
            .andExpect(jsonPath("$.data.totalElements").value(1));

        verify(getMyFinesUseCase).execute(USER_ID, "UNPAID", 0, 10);
    }

    @Test
    @DisplayName("POST /fines/payments/payos/webhook rejects invalid signature/body")
    void handlePayOsFineWebhook_shouldRejectInvalidWebhook() throws Exception {
        when(finePaymentService.confirmPayOsWebhook("tampered-body"))
            .thenThrow(new IllegalArgumentException("Invalid signature"));

        mockMvc.perform(post("/api/v1/fines/payments/payos/webhook")
                .content("tampered-body"))
            .andExpect(status().isUnauthorized());
    }

    private FineResponse fine(Long fineId, PaymentStatus status) {
        return FineResponse.builder()
            .fineId(fineId)
            .transactionId(99L)
            .publicationTitle("Clean Code")
            .fineAmount(new BigDecimal("80000"))
            .type(ViolationType.OVERDUE_RETURN)
            .status(status)
            .build();
    }
}
