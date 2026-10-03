package com.library.integration;

import com.library.circulation.application.dashboard.impl.DashboardExcelExporter;
import com.library.circulation.dto.response.DashboardReportResponse;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import static org.assertj.core.api.Assertions.*;

/** Isolated PostgreSQL only; never connects to the project's operational database. */
@Testcontainers(disabledWithoutDocker = true)
class DashboardReportSqlIntegrationTest {
    @Container static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");
    static DashboardExcelExporter exporter;
    static final DashboardReportResponse report = DashboardReportResponse.builder()
        .dateFrom(LocalDate.of(2026, 10, 3)).dateTo(LocalDate.of(2026, 10, 3))
        .circulation(DashboardReportResponse.CirculationSection.builder().returnCount(1).activeBorrowCount(2).build())
        .finance(DashboardReportResponse.FinanceSection.builder().depositsRefunded(BigDecimal.valueOf(50000))
            .finesCreated(BigDecimal.valueOf(3000)).finesCollected(BigDecimal.valueOf(500)).build())
        .topBorrowedPublications(List.of()).build();

    @BeforeAll static void schema() {
        var ds = new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
        var jdbc = new JdbcTemplate(ds);
        exporter = new DashboardExcelExporter(new NamedParameterJdbcTemplate(ds));
        jdbc.execute("CREATE TABLE users(id BIGINT PRIMARY KEY, student_id TEXT, full_name TEXT, faculty TEXT, email TEXT, phone_number TEXT, credit_score INT)");
        jdbc.execute("CREATE TABLE publications(id BIGINT PRIMARY KEY, title TEXT)");
        jdbc.execute("CREATE TABLE items(id BIGINT PRIMARY KEY, publication_id BIGINT, barcode TEXT)");
        jdbc.execute("""
            CREATE TABLE borrowing_transactions(id BIGINT PRIMARY KEY, user_id BIGINT, item_id BIGINT, borrowed_date TIMESTAMPTZ,
              due_date DATE, returned_date TIMESTAMPTZ, status TEXT, deposit_status TEXT, deposit_amount NUMERIC,
              deposit_refund_amount NUMERIC, librarian_id_return BIGINT, renewal_count INT)
            """);
        jdbc.execute("CREATE TABLE fines(id BIGINT PRIMARY KEY, transaction_id BIGINT, type TEXT, fine_amount NUMERIC, payment_status TEXT, created_at TIMESTAMPTZ, paid_date TIMESTAMPTZ, paid_by_librarian_id BIGINT)");
        jdbc.execute("CREATE TABLE borrow_deposit_events(id BIGINT PRIMARY KEY, transaction_id BIGINT, user_id BIGINT, librarian_id BIGINT, created_at TIMESTAMPTZ, event_type TEXT, amount NUMERIC, note TEXT)");
        jdbc.execute("CREATE TABLE fine_payment_orders(id BIGINT PRIMARY KEY, status TEXT)");
        jdbc.execute("CREATE TABLE fine_payment_order_fines(order_id BIGINT, fine_id BIGINT)");
        jdbc.update("INSERT INTO users VALUES (7, '00123', 'Reader', 'Faculty', 'r@example.test', '0123456789', 80), (9, NULL, 'Librarian', NULL, NULL, NULL, 100)");
        jdbc.update("INSERT INTO publications VALUES (22, 'Handbook'); INSERT INTO items VALUES (5, 22, '000BC5')");
        jdbc.update("""
            INSERT INTO borrowing_transactions VALUES
            (1, 7, 5, '2026-09-01T03:00:00Z', '2026-10-03', '2026-10-03T16:59:59Z', 'RETURNED', 'REFUNDED', 50000, 50000, 9, 1),
            (2, 7, 5, '2026-09-01T03:00:00Z', '2026-10-03', '2026-10-03T17:00:00Z', 'RETURNED', 'REFUNDED', 50000, 50000, 9, 0)
            """);
        var due = java.sql.Date.valueOf(LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).minusDays(1));
        for (long id : List.of(3L, 4L)) jdbc.update("INSERT INTO borrowing_transactions VALUES (?, 7, 5, '2020-01-01T03:00:00Z', ?, NULL, 'BORROWING', 'COLLECTED', 50000, 0, NULL, 2)", id, due);
        jdbc.update("""
            INSERT INTO fines VALUES
            (10, 3, 'OVERDUE_RETURN', 1000, 'UNPAID', '2026-10-03T03:00:00Z', NULL, NULL),
            (11, 4, 'DAMAGED_BOOK', 2000, 'UNPAID', '2026-10-03T03:00:00Z', NULL, NULL),
            (12, 1, 'DAMAGED_BOOK', 500, 'PAID', '2026-09-01T03:00:00Z', '2026-10-03T16:59:59Z', NULL)
            """);
        jdbc.update("""
            INSERT INTO borrow_deposit_events VALUES
            (20, 1, 7, 9, '2026-10-03T16:59:59Z', 'REFUNDED', 50000, 'Within period'),
            (21, 2, 7, 9, '2026-10-03T17:00:00Z', 'REFUNDED', 50000, 'Outside period')
            """);
        jdbc.update("INSERT INTO fine_payment_orders VALUES (30, 'PAID'); INSERT INTO fine_payment_order_fines VALUES (30, 12)");
    }

    @Test void riskDebtIsNotMultipliedByActiveLoansAndOnTimeUsesVietnamReturnDay() {
        var data = exporter.printData(report, 9L);
        assertThat(data.onTimeReturnRatePercent()).isEqualByComparingTo("100");
        assertThat(data.depositsHeld()).isEqualByComparingTo("100000");
        assertThat(data.riskyReaders()).singleElement().satisfies(reader -> {
            assertThat(reader.overdueCount()).isEqualTo(2);
            assertThat(reader.totalUnpaidAmount()).isEqualByComparingTo("3000");
        });
    }

    @Test void activeLoansAreNotPeriodFilteredButReturnsIncludeOnlySelectedVietnamDays() throws Exception {
        try (var book = new XSSFWorkbook(new ByteArrayInputStream(exporter.export(report, 9L)))) {
            assertThat(book.getSheetAt(1).getLastRowNum()).isEqualTo(7); // Two active loans, both borrowed in 2020.
            assertThat(book.getSheetAt(1).getRow(6).getCell(1).getStringCellValue()).isEqualTo("00123");
            var returned = book.getSheetAt(2);
            assertThat(returned.getLastRowNum()).isEqualTo(6);
            assertThat(returned.getRow(6).getCell(6).getStringCellValue()).isEqualTo("03/10/2026 23:59");
            assertThat(returned.getRow(6).getCell(8).getStringCellValue()).isEqualTo("Chưa ghi nhận");
            assertThat(returned.getRow(6).getCell(9).getNumericCellValue()).isEqualTo(50000);
        }
    }

    @Test void financialAuditUsesEventDatesAndOnlyLabelsTransfersWithRecordedPaymentEvidence() throws Exception {
        try (var book = new XSSFWorkbook(new ByteArrayInputStream(exporter.export(report, 9L)))) {
            var sheet = book.getSheetAt(3);
            var receipts = new java.util.ArrayList<String>();
            for (int row = 6; row <= sheet.getLastRowNum(); row++) {
                var entry = sheet.getRow(row);
                receipts.add(entry.getCell(0).getStringCellValue());
                if (entry.getCell(0).getStringCellValue().startsWith("PAID-12")) {
                    assertThat(entry.getCell(5).getStringCellValue()).isEqualTo("Chuyển khoản (PAYOS)");
                }
            }
            assertThat(receipts).contains("DEP-20 / GD-1", "PAID-12 / GD-1").doesNotContain("DEP-21 / GD-2");
        }
    }
}
