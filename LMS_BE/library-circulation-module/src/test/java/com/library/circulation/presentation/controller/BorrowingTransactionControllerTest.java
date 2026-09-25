package com.library.circulation.presentation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.circulation.application.transaction.BorrowRequestUseCase;
import com.library.circulation.application.transaction.ConfirmPickupUseCase;
import com.library.circulation.application.transaction.DirectBorrowUseCase;
import com.library.circulation.application.transaction.GetAllBorrowingTransactionUseCase;
import com.library.circulation.application.transaction.GetAllTransactionByItemUseCase;
import com.library.circulation.application.transaction.GetMyTransactionsUseCase;
import com.library.circulation.application.transaction.GetStudentActiveTransactionsUseCase;
import com.library.circulation.application.transaction.LookupActiveTransactionUseCase;
import com.library.circulation.application.transaction.LookupForPickupUseCase;
import com.library.circulation.application.transaction.ReportIssueUseCase;
import com.library.circulation.application.transaction.ReturnBookUseCase;
import com.library.circulation.domain.enums.TransactionStatus;
import com.library.circulation.dto.request.BorrowRequestCommand;
import com.library.circulation.dto.request.ReportIssueCommand;
import com.library.circulation.dto.request.ReturnCommand;
import com.library.circulation.dto.response.BorrowTransactionResponse;
import com.library.circulation.dto.response.LookupTransactionResponse;
import com.library.circulation.dto.response.ReportIssueResponse;
import com.library.circulation.dto.response.ReturnResponse;
import com.library.shared.util.SecurityEvaluator;
import com.library.user.domain.enums.ViolationType;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

@ExtendWith(MockitoExtension.class)
@DisplayName("BorrowingTransactionController — MockMvc")
class BorrowingTransactionControllerTest {

    private static final Long USER_ID = 4L;
    private static final Long LIBRARIAN_ID = 3L;

    @Mock private GetAllBorrowingTransactionUseCase getAllBorrowingTransactionUseCase;
    @Mock private GetAllTransactionByItemUseCase getAllTransactionByItemUseCase;
    @Mock private GetMyTransactionsUseCase getMyTransactionsUseCase;
    @Mock private BorrowRequestUseCase borrowRequestUseCase;
    @Mock private DirectBorrowUseCase directBorrowUseCase;
    @Mock private ConfirmPickupUseCase confirmPickupUseCase;
    @Mock private LookupForPickupUseCase lookupForPickupUseCase;
    @Mock private GetStudentActiveTransactionsUseCase getStudentActiveTransactionsUseCase;
    @Mock private LookupActiveTransactionUseCase lookupActiveTransactionUseCase;
    @Mock private ReturnBookUseCase returnBookUseCase;
    @Mock private ReportIssueUseCase reportIssueUseCase;
    @Mock private SecurityEvaluator security;

    @InjectMocks private BorrowingTransactionController controller;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setValidator(validator)
            .build();
    }

    @Test
    @DisplayName("POST /transactions/borrow creates borrow request for current user")
    void borrowItem_shouldUseCurrentUserAndReturnCreatedTransaction() throws Exception {
        when(security.getCurrentUserId()).thenReturn(USER_ID);
        when(borrowRequestUseCase.execute(eq(USER_ID), any(BorrowRequestCommand.class)))
            .thenReturn(BorrowTransactionResponse.builder()
                .transactionId(99L)
                .itemId(9L)
                .barcode("BK-CC-003")
                .publicationId(1L)
                .publicationTitle("Clean Code")
                .status(TransactionStatus.WAITING_FOR_PICKUP)
                .build());

        mockMvc.perform(post("/api/v1/transactions/borrow")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new BorrowRequestCommand(9L))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.code").value(201))
            .andExpect(jsonPath("$.data.transactionId").value("99"))
            .andExpect(jsonPath("$.data.status").value("WAITING_FOR_PICKUP"));

        ArgumentCaptor<BorrowRequestCommand> captor =
            ArgumentCaptor.forClass(BorrowRequestCommand.class);
        verify(borrowRequestUseCase).execute(eq(USER_ID), captor.capture());
        assertThat(captor.getValue().itemId()).isEqualTo(9L);
    }

    @Test
    @DisplayName("POST /transactions/borrow rejects missing itemId")
    void borrowItem_shouldRejectMissingItemId() throws Exception {
        mockMvc.perform(post("/api/v1/transactions/borrow")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /transactions/lookup forwards pickup lookup filters")
    void lookupTransaction_shouldForwardLookupFilters() throws Exception {
        when(lookupForPickupUseCase.execute(99L, "22520001", "BK-CC-003"))
            .thenReturn(LookupTransactionResponse.builder()
                .transactionId(99L)
                .userId(USER_ID)
                .studentId("22520001")
                .fullName("Nguyen Van A")
                .barcode("BK-CC-003")
                .publicationTitle("Clean Code")
                .status(TransactionStatus.WAITING_FOR_PICKUP)
                .build());

        mockMvc.perform(get("/api/v1/transactions/lookup")
                .param("transactionId", "99")
                .param("studentId", "22520001")
                .param("barcode", "BK-CC-003"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.transactionId").value("99"))
            .andExpect(jsonPath("$.data.studentId").value("22520001"))
            .andExpect(jsonPath("$.data.status").value("WAITING_FOR_PICKUP"));

        verify(lookupForPickupUseCase).execute(99L, "22520001", "BK-CC-003");
    }

    @Test
    @DisplayName("POST /transactions/return returns book for current librarian")
    void returnBook_shouldUseCurrentLibrarian() throws Exception {
        when(security.getCurrentUserId()).thenReturn(LIBRARIAN_ID);
        when(returnBookUseCase.execute(eq(LIBRARIAN_ID), any(ReturnCommand.class)))
            .thenReturn(ReturnResponse.builder()
                .transactionId(99L)
                .publicationTitle("Clean Code")
                .barcode("BK-CC-003")
                .returnedDate(LocalDate.of(2026, 5, 19))
                .overdue(false)
                .overdueFineAmount(BigDecimal.ZERO)
                .build());

        mockMvc.perform(post("/api/v1/transactions/return")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new ReturnCommand("BK-CC-003"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.transactionId").value("99"))
            .andExpect(jsonPath("$.data.overdue").value(false));

        ArgumentCaptor<ReturnCommand> captor = ArgumentCaptor.forClass(ReturnCommand.class);
        verify(returnBookUseCase).execute(eq(LIBRARIAN_ID), captor.capture());
        assertThat(captor.getValue().barcode()).isEqualTo("BK-CC-003");
    }

    @Test
    @DisplayName("POST /transactions/{id}/report-issue forwards fine command")
    void reportIssue_shouldUseCurrentLibrarianAndCommand() throws Exception {
        when(security.getCurrentUserId()).thenReturn(LIBRARIAN_ID);
        when(reportIssueUseCase.execute(eq(99L), eq(LIBRARIAN_ID), any(ReportIssueCommand.class)))
            .thenReturn(ReportIssueResponse.builder()
                .transactionId(99L)
                .publicationTitle("Clean Code")
                .itemStatus("LOST")
                .finesCreated(java.util.List.of(
                    ReportIssueResponse.FineDetail.builder()
                        .fineId(10L)
                        .type(ViolationType.LOST_BOOK)
                        .amount(new BigDecimal("150000"))
                        .build()))
                .build());

        ReportIssueCommand command =
            new ReportIssueCommand(ViolationType.LOST_BOOK, new BigDecimal("150000"));
        mockMvc.perform(post("/api/v1/transactions/{id}/report-issue", 99L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(command)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.transactionId").value("99"))
            .andExpect(jsonPath("$.data.finesCreated[0].type").value("LOST_BOOK"))
            .andExpect(jsonPath("$.data.finesCreated[0].amount").value(150000));

        ArgumentCaptor<ReportIssueCommand> captor =
            ArgumentCaptor.forClass(ReportIssueCommand.class);
        verify(reportIssueUseCase).execute(eq(99L), eq(LIBRARIAN_ID), captor.capture());
        assertThat(captor.getValue().type()).isEqualTo(ViolationType.LOST_BOOK);
        assertThat(captor.getValue().fineAmount()).isEqualByComparingTo("150000");
    }
}
