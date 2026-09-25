package com.library.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.library.circulation.application.transaction.BorrowRequestUseCase;
import com.library.circulation.application.transaction.ReturnBookUseCase;
import com.library.circulation.domain.enums.TransactionStatus;
import com.library.circulation.dto.request.BorrowRequestCommand;
import com.library.circulation.dto.request.ReturnCommand;
import com.library.circulation.dto.response.BorrowTransactionResponse;
import com.library.circulation.dto.response.ReturnResponse;
import com.library.circulation.infrastructure.persistence.entity.BorrowingTransactionEntity;
import com.library.circulation.infrastructure.persistence.repository.BorrowingTransactionJpaRepository;
import com.library.circulation.infrastructure.scheduler.DueDateWarningScheduler;
import com.library.circulation.infrastructure.scheduler.ExpiredPickupScheduler;
import com.library.circulation.infrastructure.scheduler.ExpiredReservationScheduler;
import com.library.circulation.infrastructure.scheduler.OverdueMarkingScheduler;
import com.library.shared.port.ItemSnapshot;
import com.library.shared.port.ItemStatusPort;
import com.library.shared.port.StoragePort;
import com.library.shared.service.EmailService;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.junit.jupiter.api.Order;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Testcontainers
@TestMethodOrder(OrderAnnotation.class)
@DisplayName("Borrow Flow — Integration Tests")
class BorrowFlowIntegrationTest {

    // ── PostgreSQL container (dùng chung cho cả test class) ──────────────────
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("library_test")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void overrideDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",      postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    // ── Mock external services ───────────────────────────────────────────────
    @MockBean KafkaTemplate<String, Object> kafkaTemplate;
    @MockBean org.springframework.kafka.core.KafkaAdmin kafkaAdmin;
    @MockBean StoragePort storagePort;
    @MockBean EmailService emailService;
    @MockBean DueDateWarningScheduler dueDateWarningScheduler;
    @MockBean ExpiredPickupScheduler expiredPickupScheduler;
    @MockBean ExpiredReservationScheduler expiredReservationScheduler;
    @MockBean OverdueMarkingScheduler overdueMarkingScheduler;
    @MockBean org.springframework.security.oauth2.client.registration.ClientRegistrationRepository clientRegistrationRepository;
    @MockBean software.amazon.awssdk.services.s3.S3Client s3Client;
    @MockBean software.amazon.awssdk.services.s3.presigner.S3Presigner s3Presigner;

    // ── Autowire use cases + repos ───────────────────────────────────────────
    @Autowired BorrowRequestUseCase borrowRequestUseCase;
    @Autowired ReturnBookUseCase returnBookUseCase;
    @Autowired BorrowingTransactionJpaRepository transactionRepo;
    @Autowired ItemStatusPort itemStatusPort;
    @Autowired JdbcTemplate jdbc;

    // Test data IDs — khớp với V2__seed_data.sql
    private static final Long USER_ID        = 4L;   // student Phạm Văn Sinh Viên
    private static final Long ITEM_ID        = 9L;   // BK-CC-003, pub 1, AVAILABLE
    private static final Long PUBLICATION_ID = 1L;
    private static final String BARCODE      = "BK-CC-003";

    private static Long createdTransactionId;

    @BeforeEach
    void ensureCleanState() {
        // Xóa fines trước (FK constraint)
        jdbc.update("""
            DELETE FROM fines WHERE transaction_id IN
              (SELECT id FROM borrowing_transactions WHERE user_id = ?)
            """, USER_ID);
        // Xóa tất cả transactions active của user để pass borrow checks
        jdbc.update(
            "DELETE FROM borrowing_transactions WHERE user_id = ? AND status != 'RETURNED'",
            USER_ID
        );
        // Xóa reservations PENDING cho publication này (tránh ReservationAssignment after return)
        jdbc.update(
            "DELETE FROM reservations WHERE publication_id = ? AND status = 'PENDING'",
            PUBLICATION_ID
        );
        // Reset item về AVAILABLE
        jdbc.update("UPDATE items SET status = 'AVAILABLE' WHERE id = ?", ITEM_ID);
    }

    // ── Test 1: Borrow ───────────────────────────────────────────────────────
    @Test
    @Order(1)
    @DisplayName("T1: Mượn sách — item chuyển RESERVED, transaction WAITING_FOR_PICKUP")
    void borrow_shouldCreateTransactionAndReserveItem() {
        // When
        BorrowTransactionResponse response =
            borrowRequestUseCase.execute(USER_ID, new BorrowRequestCommand(ITEM_ID));

        // Then — kiểm tra response
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(TransactionStatus.WAITING_FOR_PICKUP);
        assertThat(response.getBarcode()).isEqualTo(BARCODE);
        assertThat(response.getPublicationTitle()).isNotBlank();

        // Then — kiểm tra DB
        createdTransactionId = response.getTransactionId();
        Optional<BorrowingTransactionEntity> txOpt = transactionRepo.findById(createdTransactionId);
        assertThat(txOpt).isPresent();
        assertThat(txOpt.get().getStatus()).isEqualTo(TransactionStatus.WAITING_FOR_PICKUP);
        assertThat(txOpt.get().getUserId()).isEqualTo(USER_ID);
        assertThat(txOpt.get().getItemId()).isEqualTo(ITEM_ID);

        // Then — item phải là RESERVED
        ItemSnapshot item = itemStatusPort.lockAndGet(ITEM_ID);
        assertThat(item.status()).isEqualTo("RESERVED");
    }

    // ── Test 2: Return ───────────────────────────────────────────────────────
    @Test
    @Order(2)
    @DisplayName("T2: Trả sách — item về AVAILABLE, transaction RETURNED")
    void return_shouldMarkTransactionReturnedAndFreeItem() {
        // Setup: tạo trạng thái BORROWING trực tiếp trong DB
        jdbc.update("UPDATE items SET status = 'BORROWED' WHERE id = ?", ITEM_ID);
        jdbc.update("""
            INSERT INTO borrowing_transactions
              (id, user_id, item_id, status, due_date, picked_up_deadline,
               borrowed_date, renewal_count, created_at, updated_at)
            VALUES (?, ?, ?, 'BORROWING', CURRENT_DATE + 14, NOW() + INTERVAL '24 hours',
                    NOW(), 0, NOW(), NOW())
            """,
            System.currentTimeMillis(), USER_ID, ITEM_ID
        );

        // When
        Long librarianId = 3L;
        ReturnResponse response =
            returnBookUseCase.execute(librarianId, new ReturnCommand(BARCODE));

        // Then — kiểm tra response
        assertThat(response).isNotNull();
        assertThat(response.overdue()).isFalse();
        assertThat(response.publicationTitle()).isNotBlank();

        // Then — item phải về AVAILABLE
        ItemSnapshot item = itemStatusPort.lockAndGet(ITEM_ID);
        assertThat(item.status()).isEqualTo("AVAILABLE");

        // Then — transaction phải RETURNED
        Optional<BorrowingTransactionEntity> txOpt =
            transactionRepo.findById(response.transactionId());
        assertThat(txOpt).isPresent();
        assertThat(txOpt.get().getStatus()).isEqualTo(TransactionStatus.RETURNED);
        assertThat(txOpt.get().getReturnedDate()).isNotNull();
    }

    // ── Test 3: Borrow khi đã có unpaid fine ─────────────────────────────────
    @Test
    @Order(3)
    @DisplayName("T3: Mượn sách bị chặn khi có unpaid fine trong DB")
    void borrow_shouldFail_whenUserHasUnpaidFineInDB() {
        // Setup: tạo fine UNPAID cho user
        long fineId = System.currentTimeMillis();
        long txId   = fineId - 1;

        jdbc.update("""
            INSERT INTO borrowing_transactions
              (id, user_id, item_id, status, due_date, picked_up_deadline,
               borrowed_date, renewal_count, created_at, updated_at)
            VALUES (?, ?, ?, 'RETURNED', CURRENT_DATE - 5, NOW(),
                    NOW() - INTERVAL '20 days', 0, NOW(), NOW())
            """, txId, USER_ID, ITEM_ID);
        jdbc.update("""
            INSERT INTO fines (id, transaction_id, fine_amount, type, payment_status, created_at, updated_at)
            VALUES (?, ?, 5000, 'OVERDUE_RETURN', 'UNPAID', NOW(), NOW())
            """, fineId, txId);

        // When & Then
        org.junit.jupiter.api.Assertions.assertThrows(
            com.library.shared.exception.AppException.class,
            () -> borrowRequestUseCase.execute(USER_ID, new BorrowRequestCommand(ITEM_ID))
        );

        // Cleanup
        jdbc.update("DELETE FROM fines WHERE id = ?", fineId);
        jdbc.update("DELETE FROM borrowing_transactions WHERE id = ?", txId);
    }
}
