package com.library.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.library.circulation.application.reservation.CreateReservationUseCase;
import com.library.circulation.dto.request.CreateReservationCommand;
import com.library.circulation.dto.response.ReservationResponse;
import com.library.circulation.infrastructure.persistence.repository.ReservationJpaRepository;
import com.library.circulation.infrastructure.scheduler.DueDateWarningScheduler;
import com.library.circulation.infrastructure.scheduler.ExpiredPickupScheduler;
import com.library.circulation.infrastructure.scheduler.ExpiredReservationScheduler;
import com.library.circulation.infrastructure.scheduler.OverdueMarkingScheduler;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.port.StoragePort;
import com.library.shared.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
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
@Testcontainers(disabledWithoutDocker = true)
@DisplayName("Reservation native SQL — Testcontainers integration")
class ReservationNativeSqlIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("library_test")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void overrideDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

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

    @Autowired CreateReservationUseCase createReservationUseCase;
    @Autowired ReservationJpaRepository reservationJpaRepository;
    @Autowired JdbcTemplate jdbc;

    private static final Long USER_ID = 4L;
    private static final Long PUBLICATION_ID = 1L;

    @BeforeEach
    void cleanState() {
        jdbc.update("""
            DELETE FROM fines
            WHERE transaction_id IN (
                SELECT id FROM borrowing_transactions WHERE user_id = ?
            )
            """, USER_ID);
        jdbc.update("""
            DELETE FROM borrowing_transactions
            WHERE user_id = ?
              AND id > 1000
            """, USER_ID);
        jdbc.update("""
            DELETE FROM reservations
            WHERE user_id = ?
              AND publication_id = ?
              AND id > 1000
            """, USER_ID, PUBLICATION_ID);
        jdbc.update("UPDATE items SET status = 'BORROWED' WHERE publication_id = ?", PUBLICATION_ID);
    }

    @Test
    @DisplayName("creates PENDING reservation and computes next queue position with native SQL")
    void createReservation_shouldPersistPendingReservation_whenNoAvailableItems() {
        ReservationResponse response = createReservationUseCase.execute(
            USER_ID,
            new CreateReservationCommand(PUBLICATION_ID, "ANY")
        );

        assertThat(response).isNotNull();
        assertThat(response.getPublicationId()).isEqualTo(PUBLICATION_ID);
        assertThat(response.getQueuePosition()).isEqualTo(2);
        assertThat(response.getPreferredBranch()).isEqualTo("ANY");

        assertThat(reservationJpaRepository.findById(response.getReservationId()))
            .isPresent()
            .get()
            .satisfies(entity -> {
                assertThat(entity.getUserId()).isEqualTo(USER_ID);
                assertThat(entity.getPublicationId()).isEqualTo(PUBLICATION_ID);
                assertThat(entity.getStatus().name()).isEqualTo("PENDING");
                assertThat(entity.getQueuePosition()).isEqualTo(2);
            });
    }

    @Test
    @DisplayName("blocks reservation when native SQL finds available item")
    void createReservation_shouldFail_whenBookIsAvailable() {
        jdbc.update("UPDATE items SET status = 'AVAILABLE' WHERE id = 9");

        assertThatThrownBy(() -> createReservationUseCase.execute(
                USER_ID,
                new CreateReservationCommand(PUBLICATION_ID, "ANY")
            ))
            .isInstanceOf(AppException.class)
            .extracting(error -> ((AppException) error).getErrorCode())
            .isEqualTo(ErrorCode.RESERVATION_BOOK_AVAILABLE);
    }

    @Test
    @DisplayName("blocks reservation when selected branch has no item rows")
    void createReservation_shouldFail_whenBranchHasNoItems() {
        assertThatThrownBy(() -> createReservationUseCase.execute(
                USER_ID,
                new CreateReservationCommand(PUBLICATION_ID, "Nonexistent Branch")
            ))
            .isInstanceOf(AppException.class)
            .extracting(error -> ((AppException) error).getErrorCode())
            .isEqualTo(ErrorCode.RESERVATION_BRANCH_NO_ITEMS);
    }
}
