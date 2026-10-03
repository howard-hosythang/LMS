package com.library.integration;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.library.circulation.application.reshelving.ReshelvingService;
import com.library.shared.service.AuditLogService;
import java.nio.charset.StandardCharsets;
import java.sql.DriverManager;
import java.util.List;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers(disabledWithoutDocker = true)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ReshelvingSqlIntegrationTest {
    @Container static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");
    JdbcTemplate jdbc;
    ReshelvingService service;
    TransactionTemplate transaction;

    @BeforeAll void schema() throws Exception {
        var source = new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        jdbc = new JdbcTemplate(source);
        transaction = new TransactionTemplate(new DataSourceTransactionManager(source));
        service = new ReshelvingService(new NamedParameterJdbcTemplate(source), mock(AuditLogService.class));
        jdbc.execute("CREATE TABLE users(id BIGINT PRIMARY KEY, student_id TEXT, full_name TEXT)");
        jdbc.execute("CREATE TABLE publications(id BIGINT PRIMARY KEY, title TEXT)");
        jdbc.execute("CREATE TABLE items(id BIGINT PRIMARY KEY, publication_id BIGINT, barcode TEXT, location TEXT, branch TEXT, status TEXT)");
        jdbc.execute("CREATE TABLE reservations(id BIGINT PRIMARY KEY)");
        jdbc.execute("CREATE TABLE borrowing_transactions(id BIGINT PRIMARY KEY, item_id BIGINT, user_id BIGINT, status TEXT, returned_date TIMESTAMPTZ, updated_at TIMESTAMPTZ)");
        // Send the actual migration as a single PostgreSQL script (PL/pgSQL bodies
        // contain semicolons and must not be split by a generic SQL parser).
        try (var input = new ClassPathResource("db/migration/V58__book_reshelving_queue.sql").getInputStream();
             var connection = DriverManager.getConnection(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
             var statement = connection.createStatement()) {
            statement.execute(new String(input.readAllBytes(), StandardCharsets.UTF_8));
        }
        // Seed V58 state to verify V59 upgrades actual backlog/history, not just an empty schema.
        jdbc.update("INSERT INTO users VALUES (7, '2213214', 'Reader')");
        jdbc.update("INSERT INTO publications VALUES (1, 'Book')");
        jdbc.update("INSERT INTO items VALUES (100, 1, 'OLD100', 'A1', 'Cơ sở 1 - Lý Thường Kiệt', 'AVAILABLE'), (101, 1, 'OLD101', 'A2', 'Cơ sở 1 - Lý Thường Kiệt', 'AVAILABLE')");
        jdbc.update("INSERT INTO borrowing_transactions VALUES (100, 100, 7, 'RETURNED', NOW(), NOW(), 'WAITING', NULL, NULL), (101, 101, 7, 'RETURNED', NOW(), NOW(), 'SHELVED', NOW(), 7)");
        try (var input = new ClassPathResource("db/migration/V59__reshelving_tasks_for_released_holds.sql").getInputStream();
             var connection = DriverManager.getConnection(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
             var statement = connection.createStatement()) {
            statement.execute(new String(input.readAllBytes(), StandardCharsets.UTF_8));
        }
        assertThat(service.getWaiting()).singleElement().satisfies(item -> assertThat(item.taskId()).isEqualTo("100"));
        assertThat(jdbc.queryForObject("SELECT status FROM reshelving_tasks WHERE id = 101", String.class)).isEqualTo("SHELVED");
        assertThat(jdbc.queryForObject("SELECT shelved_by_librarian_id FROM reshelving_tasks WHERE id = 101", Long.class)).isEqualTo(7L);
    }

    @BeforeEach void data() {
        // This datasource belongs exclusively to the disposable test container.
        jdbc.execute("TRUNCATE reshelving_tasks, reservations, borrowing_transactions, items, publications, users CASCADE");
        jdbc.update("INSERT INTO users VALUES (7, '2213214', 'Reader')");
        jdbc.update("INSERT INTO publications VALUES (1, 'Book')");
        jdbc.update("INSERT INTO items VALUES (1, 1, 'BC1', 'A1', 'Cơ sở 1 - Lý Thường Kiệt', 'AVAILABLE')");
        jdbc.update("INSERT INTO borrowing_transactions VALUES (1, 1, 7, 'RETURNED', NOW(), NOW(), 'NOT_REQUIRED', NULL, NULL)");
    }

    @Test void historicalReturnsRemainNotRequiredAndNormalReturnEntersQueue() {
        assertThat(service.countWaiting()).isZero();
        transaction.executeWithoutResult(status -> service.recordReturn(1L, false));
        assertThat(service.countWaiting()).isEqualTo(1);
        assertThat(service.getWaiting()).singleElement().satisfies(item -> {
            assertThat(item.source()).isEqualTo("RETURN");
            assertThat(item.location()).isEqualTo("A1");
        });
    }

    @Test void assignedReservationDoesNotEnterShelvingQueue() {
        jdbc.update("UPDATE items SET status = 'RESERVED' WHERE id = 1");
        transaction.executeWithoutResult(status -> service.recordReturn(1L, true));
        assertThat(service.countWaiting()).isZero();
        assertThat(state()).isEqualTo("NOT_REQUIRED");
    }

    @ParameterizedTest @ValueSource(strings = {"BORROWED", "RESERVED", "IN_MAINTENANCE", "LOST"})
    void copyLeavingAvailableAutomaticallyClosesWaitingTask(String newStatus) {
        transaction.executeWithoutResult(status -> service.recordReturn(1L, false));
        long taskId = queueId();
        jdbc.update("UPDATE items SET status = ? WHERE id = 1", newStatus);
        assertThat(service.countWaiting()).isZero();
        assertThat(state()).isEqualTo("NOT_REQUIRED");
        assertThat(jdbc.queryForObject("SELECT shelved_at IS NULL FROM borrowing_transactions WHERE id = 1", Boolean.class)).isTrue();
        var result = transaction.execute(status -> service.confirm(List.of(taskId), 7L, "Cơ sở 1 - Lý Thường Kiệt"));
        assertThat(result).containsEntry("updatedCount", 0);
    }

    @Test void confirmationStoresActorAndTimeAndIsIdempotent() {
        transaction.executeWithoutResult(status -> service.recordReturn(1L, false));
        long taskId = queueId();
        var firstConfirmation = transaction.execute(status -> service.confirm(List.of(taskId), 7L, "Cơ sở 1 - Lý Thường Kiệt"));
        assertThat(firstConfirmation).containsEntry("updatedCount", 1);
        assertThat(state()).isEqualTo("SHELVED");
        assertThat(jdbc.queryForObject("SELECT shelved_by_librarian_id FROM borrowing_transactions WHERE id = 1", Long.class)).isEqualTo(7L);
        assertThat(jdbc.queryForObject("SELECT shelved_at IS NOT NULL FROM borrowing_transactions WHERE id = 1", Boolean.class)).isTrue();
        var repeatConfirmation = transaction.execute(status -> service.confirm(List.of(taskId), 7L, "Cơ sở 1 - Lý Thường Kiệt"));
        assertThat(repeatConfirmation).containsEntry("updatedCount", 0);
        transaction.executeWithoutResult(status -> service.recordReturn(1L, false));
        assertThat(service.countWaiting()).isZero();
        assertThat(state()).isEqualTo("SHELVED");
        jdbc.update("UPDATE items SET status = 'BORROWED' WHERE id = 1");
        assertThat(state()).isEqualTo("SHELVED");
    }

    @Test void confirmationDoesNotTouchNewlyArrivedUnselectedBooks() {
        transaction.executeWithoutResult(status -> service.recordReturn(1L, false));
        long selectedTaskId = queueId();
        jdbc.update("INSERT INTO items VALUES (2, 1, 'BC2', 'A2', 'Cơ sở 1 - Lý Thường Kiệt', 'AVAILABLE')");
        jdbc.update("INSERT INTO borrowing_transactions VALUES (2, 2, 7, 'RETURNED', NOW(), NOW(), 'NOT_REQUIRED', NULL, NULL)");
        transaction.executeWithoutResult(status -> service.recordReturn(2L, false));
        transaction.executeWithoutResult(status -> service.confirm(List.of(selectedTaskId), 7L, "Cơ sở 1 - Lý Thường Kiệt"));
        assertThat(service.getWaiting()).singleElement().satisfies(item -> assertThat(item.barcode()).isEqualTo("BC2"));
    }

    @ParameterizedTest @ValueSource(strings = {"PICKUP_EXPIRED", "RESERVATION_EXPIRED", "RESERVATION_CANCELLED", "LOST_RECOVERED"})
    void releasedHoldAndRecoveryAreQueuedWithoutFakeReturns(String name) {
        var source = ReshelvingService.Source.valueOf(name);
        boolean reserved = name.startsWith("RESERVATION");
        jdbc.update("INSERT INTO reservations VALUES (20)");
        jdbc.update("UPDATE borrowing_transactions SET status = 'CANCELLED', returned_date = NULL WHERE id = 1");
        transaction.executeWithoutResult(status -> {
            service.recordAvailable(1L, reserved ? null : 1L, reserved ? 20L : null, 7L, source);
            service.recordAvailable(1L, reserved ? null : 1L, reserved ? 20L : null, 7L, source);
        });
        assertThat(service.countWaiting()).isEqualTo(1);
        assertThat(service.getWaiting()).singleElement().satisfies(item -> assertThat(item.source()).isEqualTo(name));
        long id = queueId();
        transaction.executeWithoutResult(status -> service.confirm(List.of(id), 7L, "Cơ sở 1 - Lý Thường Kiệt"));
        assertThat(jdbc.queryForObject("SELECT status FROM reshelving_tasks WHERE id = ?", String.class, id)).isEqualTo("SHELVED");
        assertThat(jdbc.queryForObject("SELECT status FROM borrowing_transactions WHERE id = 1", String.class)).isEqualTo("CANCELLED");
        assertThat(state()).isEqualTo("NOT_REQUIRED");
    }

    @Test void reservingAgainClosesReleaseTaskButNextReleaseCreatesNewTask() {
        jdbc.update("INSERT INTO reservations VALUES (20), (21)");
        transaction.executeWithoutResult(status -> service.recordAvailable(1L, null, 20L, 7L, ReshelvingService.Source.RESERVATION_EXPIRED));
        long oldId = queueId();
        jdbc.update("UPDATE items SET status = 'RESERVED' WHERE id = 1");
        assertThat(service.countWaiting()).isZero();
        jdbc.update("UPDATE items SET status = 'AVAILABLE' WHERE id = 1");
        transaction.executeWithoutResult(status -> service.recordAvailable(1L, null, 21L, 7L, ReshelvingService.Source.RESERVATION_CANCELLED));
        assertThat(service.countWaiting()).isEqualTo(1);
        assertThat(queueId()).isNotEqualTo(oldId);
        assertThat(jdbc.queryForObject("SELECT status FROM reshelving_tasks WHERE id = ?", String.class, oldId)).isEqualTo("NOT_REQUIRED");
    }

    @Test void mixedBranchConfirmationCannotShelveOtherCampus() {
        jdbc.update("INSERT INTO items VALUES (2, 1, 'BC2', 'A2', 'Cơ sở 2 - Dĩ An', 'AVAILABLE')");
        jdbc.update("INSERT INTO borrowing_transactions VALUES (2, 2, 7, 'RETURNED', NOW(), NOW(), 'NOT_REQUIRED', NULL, NULL)");
        transaction.executeWithoutResult(status -> { service.recordReturn(1L, false); service.recordReturn(2L, false); });
        assertThat(service.getWaiting("Cơ sở 1 - Lý Thường Kiệt")).singleElement().satisfies(item -> assertThat(item.barcode()).isEqualTo("BC1"));
        assertThat(service.countWaiting("Cơ sở 2 - Dĩ An")).isEqualTo(1);
        var ids = service.getWaiting().stream().map(item -> Long.valueOf(item.taskId())).toList();
        var result = transaction.execute(status -> service.confirm(ids, 7L, "Cơ sở 1 - Lý Thường Kiệt"));
        assertThat(result).containsEntry("updatedCount", 1).containsEntry("skippedCount", 1);
        assertThat(service.countWaiting("Cơ sở 2 - Dĩ An")).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT reshelving_status FROM borrowing_transactions WHERE id = 2", String.class)).isEqualTo("WAITING");
    }

    private long queueId() { return jdbc.queryForObject("SELECT id FROM reshelving_tasks WHERE item_id = 1 AND status = 'WAITING'", Long.class); }

    private String state() { return jdbc.queryForObject("SELECT reshelving_status FROM borrowing_transactions WHERE id = 1", String.class); }
}
