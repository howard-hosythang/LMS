package com.library.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** Runs actual V1..V62 against a disposable PostgreSQL, never an operational DB. */
@Testcontainers(disabledWithoutDocker = true)
class DemoSeedMigrationIntegrationTest {
    @Container
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");
    static JdbcTemplate jdbc;
    static final Map<String, Long> before = new LinkedHashMap<>();
    static final String DEMO_ITEMS = "SELECT id FROM items WHERE barcode LIKE 'BK-V62-%'";

    static Flyway flyway(String target) {
        return Flyway.configure().dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
            .locations("classpath:db/migration").target(target).cleanDisabled(true).load();
    }

    @BeforeAll
    static void migrate() {
        jdbc = new JdbcTemplate(new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword()));
        flyway("61").migrate();
        // Occupy the preferred ID block AND the first reader's natural identifier.
        // V62 must select another block/account code, not overwrite this record.
        jdbc.update("""
            INSERT INTO users(id,full_name,email,status,student_id,phone_number)
            VALUES(762620000000001001,'Preserved reader','preserved@example.invalid','ACTIVE','2199001','0990000000')
            """);
        for (String table : new String[]{"users", "items", "borrowing_transactions", "reservations", "fines",
                "ratings", "wish_lists", "contact_messages", "fine_payment_orders", "deposit_payment_orders"}) {
            before.put(table, count("SELECT COUNT(*) FROM " + table));
        }
        var result = flyway("62").migrate();
        assertThat(result.migrationsExecuted).isEqualTo(1);
    }

    static long count(String sql) { return jdbc.queryForObject(sql, Long.class); }

    @Test
    void fullFlywayChainCreatesExpectedRowsAndPreservesExistingAccountsAndPaymentOrders() {
        assertThat(count("SELECT COUNT(*) FROM users") - before.get("users")).isEqualTo(134);
        assertThat(count("SELECT COUNT(*) FROM items") - before.get("items")).isEqualTo(132);
        assertThat(count("SELECT COUNT(*) FROM borrowing_transactions") - before.get("borrowing_transactions")).isEqualTo(600);
        assertThat(count("SELECT COUNT(*) FROM reservations") - before.get("reservations")).isEqualTo(30);
        assertThat(count("SELECT COUNT(*) FROM fines") - before.get("fines")).isEqualTo(40);
        assertThat(count("SELECT COUNT(*) FROM ratings") - before.get("ratings")).isEqualTo(198);
        assertThat(count("SELECT COUNT(*) FROM contact_messages") - before.get("contact_messages")).isEqualTo(20);
        assertThat(count("SELECT COUNT(*) FROM fine_payment_orders")).isEqualTo(before.get("fine_payment_orders"));
        assertThat(count("SELECT COUNT(*) FROM deposit_payment_orders")).isEqualTo(before.get("deposit_payment_orders"));
        assertThat(jdbc.queryForObject("SELECT full_name FROM users WHERE student_id='2199001'",String.class)).isEqualTo("Preserved reader");
        assertThat(count("SELECT COUNT(*) FROM users WHERE email LIKE 'lib%@example.invalid' AND status='ACTIVE' AND student_id LIKE 'LIB%'")).isZero();
        assertThat(count("""
            SELECT COUNT(*) FROM (
              SELECT LEFT(student_id,2),faculty,COUNT(*) AS amount FROM users
              WHERE email LIKE 'sv.%@example.invalid' AND student_id NOT LIKE 'LIB%'
              GROUP BY LEFT(student_id,2),faculty HAVING COUNT(*)=3
            ) groups
            """)).isEqualTo(44);
    }

    @Test
    void timelinesCopyStatesReviewsAndLedgerAreConsistent() {
        assertThat(count("""
            SELECT COUNT(*) FROM (
              SELECT borrowed_date,LAG(returned_date) OVER (PARTITION BY item_id ORDER BY borrowed_date NULLS LAST,id) AS previous_return
              FROM borrowing_transactions WHERE item_id IN (
                SELECT id FROM items WHERE barcode LIKE 'BK-V62-%'
              ) AND borrowed_date IS NOT NULL
            ) timeline WHERE borrowed_date<previous_return
            """)).isZero();
        assertThat(count("SELECT COUNT(*) FROM borrowing_transactions WHERE item_id IN ("+DEMO_ITEMS+") AND returned_date<borrowed_date")).isZero();
        assertThat(count("SELECT COUNT(*) FROM reshelving_tasks WHERE item_id IN ("+DEMO_ITEMS+") AND status='WAITING'")).isEqualTo(20);
        assertThat(count("""
            SELECT COUNT(*) FROM reshelving_tasks q JOIN items i ON i.id=q.item_id
            WHERE i.barcode LIKE 'BK-V62-%' AND q.status='WAITING' AND i.status<>'AVAILABLE'
            """)).isZero();
        assertThat(count("""
            SELECT COUNT(*) FROM items i WHERE i.barcode LIKE 'BK-V62-%' AND (
              (i.status='BORROWED' AND (SELECT COUNT(*) FROM borrowing_transactions t WHERE t.item_id=i.id AND t.status IN ('BORROWING','OVERDUE'))<>1)
              OR (i.status='AVAILABLE' AND EXISTS(SELECT 1 FROM borrowing_transactions t WHERE t.item_id=i.id AND t.status IN ('BORROWING','OVERDUE','WAITING_FOR_PICKUP')))
            )
            """)).isZero();
        assertThat(count("""
            SELECT COUNT(*) FROM ratings r JOIN borrowing_transactions t ON t.id=r.transaction_id JOIN items i ON i.id=t.item_id
            WHERE i.barcode LIKE 'BK-V62-%' AND (r.user_id<>t.user_id OR r.publication_id<>i.publication_id
              OR r.item_barcode<>i.barcode OR r.created_at<t.returned_date OR r.created_at>t.returned_date+INTERVAL '7 days'
              OR r.helpful_count<>(SELECT COUNT(*) FROM rating_helpful_votes v WHERE v.rating_id=r.id))
            """)).isZero();
        assertThat(count("""
            SELECT COUNT(*) FROM borrowing_transactions t WHERE t.item_id IN (
              SELECT id FROM items WHERE barcode LIKE 'BK-V62-%'
            ) AND (
              t.deposit_amount<>COALESCE((SELECT SUM(e.amount) FROM borrow_deposit_events e WHERE e.transaction_id=t.id AND e.event_type='COLLECTED'),0)
              OR t.deposit_applied_amount<>COALESCE((SELECT SUM(e.amount) FROM borrow_deposit_events e WHERE e.transaction_id=t.id AND e.event_type='APPLIED_TO_FINE'),0)
              OR t.deposit_refund_amount<>COALESCE((SELECT SUM(e.amount) FROM borrow_deposit_events e WHERE e.transaction_id=t.id AND e.event_type='REFUNDED'),0)
              OR (t.status='RETURNED' AND t.deposit_additional_amount_due<>COALESCE((SELECT SUM(f.fine_amount) FROM fines f WHERE f.transaction_id=t.id AND f.payment_status='UNPAID'),0))
            )
            """)).isZero();
        assertThat(count("SELECT COUNT(*) FROM ratings r JOIN items i ON i.barcode=r.item_barcode WHERE i.barcode LIKE 'BK-V62-%' AND r.created_at>NOW()")).isZero();
    }

    @Test
    void repeatedBackendStartupDoesNotSeedTwice() {
        long users = count("SELECT COUNT(*) FROM users");
        long transactions = count("SELECT COUNT(*) FROM borrowing_transactions");
        assertThat(flyway("62").migrate().migrationsExecuted).isZero();
        assertThat(count("SELECT COUNT(*) FROM users")).isEqualTo(users);
        assertThat(count("SELECT COUNT(*) FROM borrowing_transactions")).isEqualTo(transactions);
    }

    @Test
    void failedSeedRollsBackAllNewRowsWithoutChangingCompletedFlywayHistory() throws Exception {
        String script;
        try (var input = new ClassPathResource("db/migration/V62__coherent_demo_circulation_seed.sql").getInputStream()) {
            script = new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
        var snapshot = new LinkedHashMap<String, Long>();
        for (String table : new String[]{"users","items","borrowing_transactions","reservations","fines",
                "borrow_deposit_events","reshelving_tasks","ratings","rating_helpful_votes","rating_replies",
                "system_reviews","contact_messages","contact_message_comments","notifications","audit_logs"}) {
            snapshot.put(table, count("SELECT COUNT(*) FROM " + table));
        }
        String probe = script + "\nDO $$ BEGIN RAISE EXCEPTION 'V62 rollback probe'; END $$;";
        var transaction = new TransactionTemplate(new DataSourceTransactionManager(jdbc.getDataSource()));
        assertThatThrownBy(() -> transaction.execute(status -> { jdbc.execute(probe); return null; }))
            .hasMessageContaining("V62 rollback probe");
        snapshot.forEach((table, amount) -> assertThat(count("SELECT COUNT(*) FROM " + table)).as(table).isEqualTo(amount));
        assertThat(count("SELECT COUNT(*) FROM flyway_schema_history WHERE version='62' AND success")).isEqualTo(1);
    }
}
