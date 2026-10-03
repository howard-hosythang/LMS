package com.library.circulation.application.dashboard;

import com.library.circulation.application.dashboard.impl.DashboardExcelExporter;
import com.library.circulation.application.dashboard.impl.DashboardReportUseCaseImpl;
import com.library.circulation.dto.response.DashboardReportResponse;
import com.library.shared.exception.AppException;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DashboardExcelExporterTest {
    private final NamedParameterJdbcTemplate jdbc = mock(NamedParameterJdbcTemplate.class);
    private final DashboardExcelExporter exporter = new DashboardExcelExporter(jdbc);
    private final DashboardReportResponse report = DashboardReportResponse.builder()
        .dateFrom(LocalDate.of(2026,10,1)).dateTo(LocalDate.of(2026,10,3))
        .circulation(DashboardReportResponse.CirculationSection.builder().borrowCount(5).returnCount(4).activeBorrowCount(3).build())
        .finance(DashboardReportResponse.FinanceSection.builder().depositsRefunded(BigDecimal.valueOf(50000))
            .finesCreated(BigDecimal.valueOf(10000)).finesCollected(BigDecimal.valueOf(3000)).build())
        .topBorrowedPublications(List.of(DashboardReportResponse.TopBorrowedPublication.builder()
            .publicationId(9007199254740993L).title("=HYPERLINK(\"evil\")").borrowCount(3).build())).build();

    @BeforeEach @SuppressWarnings("unchecked") void prepare() {
        when(jdbc.queryForMap(anyString(), any(MapSqlParameterSource.class))).thenReturn(Map.of(
            "returned", 4L, "on_time", 3L, "held", BigDecimal.valueOf(150000), "overdue_in_period", 2L));
        when(jdbc.queryForObject(anyString(), anyMap(), eq(String.class))).thenReturn("Librarian A");
        when(jdbc.query(anyString(), any(MapSqlParameterSource.class), any(RowMapper.class))).thenReturn(List.of());
        when(jdbc.queryForList(anyString(), any(MapSqlParameterSource.class))).thenReturn(List.of());
    }

    @Test void exportsFiveStyledSheetsWithNumericMoneyAndStringIdentifiers() throws Exception {
        byte[] bytes = exporter.export(report, 7L);
        try (var book = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            assertThat(book.getNumberOfSheets()).isEqualTo(5);
            assertThat(book.getSheetName(0)).contains("Tổng quan");
            assertThat(book.getSheetName(4)).contains("Bạn đọc");
            var sheet = book.getSheetAt(0);
            assertThat(sheet.getRow(8).getCell(1).getNumericCellValue()).isEqualTo(75);
            assertThat(sheet.getRow(11).getCell(1).getNumericCellValue()).isEqualTo(150000);
            assertThat(sheet.getRow(16).getCell(0).getCellType()).isEqualTo(CellType.STRING);
            assertThat(sheet.getRow(16).getCell(2).getStringCellValue()).isEqualTo("9007199254740993");
            assertThat(sheet.getRow(5).getCell(0).getCellStyle().getFillForegroundColor()).isNotZero();
            for (var s : book) {
                assertThat(s.getPaneInformation().isFreezePane()).isTrue();
                assertThat(s.getRepeatingRows().getFirstRow()).isEqualTo(5);
            }
        }
    }

    @Test void snapshotUsesVietnamDateBoundariesAndTrueOnTimeReturnRate() {
        var data = exporter.printData(report, 7L);
        assertThat(data.onTimeReturnRatePercent()).isEqualByComparingTo("75.0");
        assertThat(data.preparedBy()).isEqualTo("Librarian A");
        var capture = org.mockito.ArgumentCaptor.forClass(MapSqlParameterSource.class);
        verify(jdbc).queryForMap(anyString(), capture.capture());
        assertThat(((java.sql.Timestamp)capture.getValue().getValue("start")).toInstant().toString()).isEqualTo("2026-09-30T17:00:00Z");
        assertThat(((java.sql.Timestamp)capture.getValue().getValue("end")).toInstant().toString()).isEqualTo("2026-10-03T17:00:00Z");
    }

    @Test void zeroReturnsDoesNotDivideByZero() {
        when(jdbc.queryForMap(anyString(), any(MapSqlParameterSource.class))).thenReturn(Map.of("returned", 0, "on_time", 0));
        assertThat(exporter.printData(report, 7L).onTimeReturnRatePercent()).isZero();
    }

    @Test void detailCellsKeepLeadingZerosVietnamTimesAndUnknownHistoricalFacts() throws Exception {
        var active = new java.util.HashMap<String, Object>();
        active.put("student_id", "00123"); active.put("full_name", "Reader"); active.put("barcode", "000BC5");
        active.put("title", "=HYPERLINK(\"evil\")");
        active.put("borrowed_date", java.sql.Timestamp.from(java.time.Instant.parse("2026-10-02T17:01:00Z")));
        active.put("due_date", java.sql.Date.valueOf("2026-10-03")); active.put("held", BigDecimal.valueOf(50000));
        active.put("renewal_count", 2); active.put("overdue_days", 0); active.put("status_label", "Đang mượn");
        var returned = new java.util.HashMap<>(active);
        returned.put("returned_date", java.sql.Timestamp.from(java.time.Instant.parse("2026-10-03T16:59:59Z")));
        returned.put("received_by", "Librarian B"); returned.put("deposit_refund_amount", BigDecimal.valueOf(49000));
        returned.put("fines", BigDecimal.valueOf(1000));
        var event = Map.<String, Object>of("receipt", "DEP-9007199254740993 / GD-2", "occurred_at", returned.get("returned_date"),
            "student_id", "00123", "event", "Hoàn cọc", "amount", BigDecimal.valueOf(49000), "method", "Chưa ghi nhận");
        when(jdbc.queryForList(anyString(), any(MapSqlParameterSource.class)))
            .thenReturn(List.of(active)).thenReturn(List.of(returned)).thenReturn(List.of(event));
        try (var book = new XSSFWorkbook(new ByteArrayInputStream(exporter.export(report, 7L)))) {
            var loan = book.getSheetAt(1).getRow(6);
            assertThat(loan.getCell(1).getStringCellValue()).isEqualTo("00123");
            assertThat(loan.getCell(3).getStringCellValue()).isEqualTo("000BC5");
            assertThat(loan.getCell(4).getCellType()).isEqualTo(CellType.STRING);
            assertThat(loan.getCell(5).getStringCellValue()).isEqualTo("03/10/2026 00:01");
            assertThat(loan.getCell(9).getNumericCellValue()).isEqualTo(50000);
            assertThat(book.getSheetAt(2).getRow(6).getCell(8).getStringCellValue()).isEqualTo("Chưa ghi nhận");
            assertThat(book.getSheetAt(2).getRow(6).getCell(9).getNumericCellValue()).isEqualTo(49000);
            assertThat(book.getSheetAt(3).getRow(6).getCell(0).getStringCellValue()).contains("9007199254740993");
        }
    }

    @Test void refusesOversizedExportInsteadOfSilentlyTruncating() {
        when(jdbc.queryForList(anyString(), any(MapSqlParameterSource.class))).thenReturn(java.util.Collections.nCopies(50001, Map.of()));
        assertThatThrownBy(() -> exporter.export(report, 7L)).isInstanceOf(AppException.class);
    }

    @Test void invalidRangesFailBeforeAnyDatabaseAccess() {
        var service = new DashboardReportUseCaseImpl(jdbc, exporter);
        assertThatThrownBy(() -> service.exportExcel(report.dateTo(), report.dateFrom(), 7L)).isInstanceOf(AppException.class);
        assertThatThrownBy(() -> service.printReport(null, report.dateTo(), 7L)).isInstanceOf(AppException.class);
        assertThatThrownBy(() -> service.exportExcel(LocalDate.of(2010,1,1), report.dateTo(), 7L)).isInstanceOf(AppException.class);
        verifyNoInteractions(jdbc);
    }
}
