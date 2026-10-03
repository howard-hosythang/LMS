package com.library.integration;

import static org.assertj.core.api.Assertions.*;
import com.library.circulation.application.inquiry.CirculationInquiryService;
import com.library.circulation.application.transaction.impl.GetAllBorrowingTransactionUseCaseImpl;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** Isolated read-model fixtures: never connects to the application database. */
@Testcontainers(disabledWithoutDocker = true)
class CirculationInquirySqlIntegrationTest {
    @Container static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");
    static JdbcTemplate jdbc;
    static GetAllBorrowingTransactionUseCaseImpl transactions;
    static CirculationInquiryService inquiry;

    @BeforeAll static void schema() {
        var ds = new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        jdbc = new JdbcTemplate(ds);
        var named = new NamedParameterJdbcTemplate(ds);
        transactions = new GetAllBorrowingTransactionUseCaseImpl(named);
        inquiry = new CirculationInquiryService(named, transactions);
        jdbc.execute("CREATE TABLE users(id BIGINT PRIMARY KEY, full_name TEXT, student_id TEXT, email TEXT, phone_number TEXT)");
        jdbc.execute("CREATE TABLE roles(id BIGINT PRIMARY KEY, role_name TEXT)");
        jdbc.execute("CREATE TABLE user_roles(user_id BIGINT, role_id BIGINT)");
        jdbc.execute("CREATE TABLE publications(id BIGINT PRIMARY KEY, title TEXT, cover_image_url TEXT)");
        jdbc.execute("CREATE TABLE authors(id BIGINT PRIMARY KEY, name TEXT)");
        jdbc.execute("CREATE TABLE publication_authors(publication_id BIGINT, author_id BIGINT)");
        jdbc.execute("CREATE TABLE items(id BIGINT PRIMARY KEY, publication_id BIGINT, barcode TEXT, branch TEXT, location TEXT, status TEXT, condition TEXT, acquired_date DATE, created_at TIMESTAMPTZ)");
        jdbc.execute("""
            CREATE TABLE borrowing_transactions(id BIGINT PRIMARY KEY, item_id BIGINT, user_id BIGINT,
              librarian_id_issue BIGINT, librarian_id_return BIGINT, status TEXT,
              created_at TIMESTAMPTZ, borrowed_date TIMESTAMPTZ, due_date DATE, returned_date TIMESTAMPTZ,
              deposit_amount NUMERIC, deposit_status TEXT, deposit_gross_fine_amount NUMERIC,
              deposit_applied_amount NUMERIC, deposit_refund_amount NUMERIC, deposit_additional_amount_due NUMERIC)
            """);
        jdbc.execute("CREATE TABLE fines(id BIGINT PRIMARY KEY, transaction_id BIGINT, type TEXT, fine_amount NUMERIC, payment_status TEXT, created_at TIMESTAMPTZ, paid_date TIMESTAMPTZ, paid_by_librarian_id BIGINT)");
        jdbc.execute("CREATE TABLE transaction_notes(id BIGINT PRIMARY KEY, transaction_id BIGINT, librarian_id BIGINT, important BOOLEAN, note TEXT, created_at TIMESTAMPTZ)");
        jdbc.execute("CREATE TABLE reshelving_tasks(id BIGINT PRIMARY KEY, item_id BIGINT, transaction_id BIGINT, status TEXT, source TEXT, queued_at TIMESTAMPTZ, shelved_at TIMESTAMPTZ, shelved_by_librarian_id BIGINT)");
        jdbc.update("INSERT INTO users VALUES (7, 'Reader', '00123', 'r@example.test', NULL), (8, 'Librarian A', 'L01', NULL, NULL), (9, 'Librarian B', 'L02', NULL, NULL)");
        jdbc.update("INSERT INTO roles VALUES (1, 'STUDENT'); INSERT INTO user_roles VALUES (7, 1)");
        jdbc.update("INSERT INTO publications VALUES (22, 'Java handbook', 'cover.jpg')");
        jdbc.update("INSERT INTO authors VALUES (1, 'Author A'), (2, 'Author B'); INSERT INTO publication_authors VALUES (22, 1), (22, 2)");
        jdbc.update("INSERT INTO items VALUES (5, 22, 'BC5', 'Cơ sở 1 - Lý Thường Kiệt', 'A1', 'AVAILABLE', 'NEW', '2026-09-01', '2026-09-01T03:00:00Z'), (6, 22, 'BC6', 'Cơ sở 2 - Dĩ An', 'B1', 'AVAILABLE', 'OLD', NULL, NOW())");
        jdbc.update("INSERT INTO borrowing_transactions VALUES (1, 5, 7, 8, 9, 'RETURNED', '2026-09-01T03:00:00Z', '2026-09-02T03:00:00Z', '2026-10-03', '2026-10-03T16:59:59Z', 50000, 'ADDITIONAL_DUE', 100000, 50000, 0, 50000), (2, 5, 7, 8, NULL, 'CANCELLED', '2026-10-01T03:00:00Z', NULL, '2026-10-04', NULL, 0, 'NOT_REQUIRED', 0, 0, 0, 0)");
        jdbc.update("INSERT INTO fines VALUES (10, 1, 'DAMAGED_BOOK', 100000, 'PAID', '2026-10-03T17:00:00Z', '2026-10-04T03:00:00Z', 8), (11, 1, 'OVERDUE_RETURN', 1000, 'PAID', '2026-10-03T17:00:00Z', '2026-10-04T04:00:00Z', 9)");
        jdbc.update("INSERT INTO transaction_notes VALUES (30, 1, 8, TRUE, 'Handover note', '2026-10-04T05:00:00Z')");
        jdbc.update("INSERT INTO reshelving_tasks VALUES (40, 5, 1, 'SHELVED', 'RETURN', '2026-10-04T05:00:00Z', '2026-10-04T06:00:00Z', 9), (41, 6, NULL, 'WAITING', 'RESERVATION_EXPIRED', NOW(), NULL, NULL)");
    }

    @Test void multipleAuthorsAndFinesDoNotDuplicateRowsOrCount() {
        var result = transactions.execute(0, 15, "Java", null, null, null, null, null, null);
        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getPublicationId()).isEqualTo(22);
        assertThat(result.getContent().get(0).getAuthors()).isEqualTo("Author A, Author B");
        assertThat(result.getContent().stream().filter(t -> t.getTransactionId() == 1).findFirst().orElseThrow().getFineAmount()).isEqualByComparingTo("101000");
    }

    @Test void returnDateRangeIncludesLastVietnamSecondAndExcludesUnreturnedTransactions() {
        var result = transactions.search(0, 15, null, null, null, "2026-10-03", "2026-10-03", null, null, "RETURNED", 7L, 5L, null, null);
        assertThat(result.getContent()).singleElement().satisfies(t -> assertThat(t.getTransactionId()).isEqualTo(1));
    }

    @Test void branchOverviewSeparatesAvailableAndAwaitingShelvingAndBarcodeIsExact() {
        var result = inquiry.publication(22L, "Cơ sở 2 - Dĩ An", 0, 10);
        assertThat(((Number) result.counts().get("total")).intValue()).isEqualTo(1);
        assertThat(((Number) result.counts().get("ready")).intValue()).isZero();
        assertThat(((Number) result.counts().get("waiting")).intValue()).isEqualTo(1);
        assertThat(inquiry.barcode("BC5").get("itemId")).isEqualTo("5");
    }

    @Test void detailKeepsIndividualCollectorsAndTimelineUnionsOnlyRecordedEvents() {
        var detail = inquiry.transaction(1L);
        assertThat(detail.fines()).extracting(f -> f.get("paidByName")).containsExactly("Librarian A", "Librarian B");
        var timeline = inquiry.timeline(5L, 0, 100);
        var types = timeline.getContent().stream().map(e -> e.get("type")).collect(Collectors.toSet());
        assertThat(types).containsAll(Set.of("ACQUIRED", "REQUEST", "ISSUE", "RETURN", "FINE_CREATED", "FINE_PAID", "RESHELVING_QUEUED", "SHELVED", "NOTE"));
        assertThat(timeline.getTotalElements()).isEqualTo(12);
        assertThat(inquiry.timeline(5L, 1, 3).getContent()).hasSize(3);
        assertThat(inquiry.readers("00123")).singleElement();
    }
}
