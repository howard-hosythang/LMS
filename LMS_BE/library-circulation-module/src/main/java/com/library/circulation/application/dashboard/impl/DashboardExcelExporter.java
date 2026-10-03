package com.library.circulation.application.dashboard.impl;

import com.library.circulation.dto.response.DashboardReportResponse;
import com.library.circulation.dto.response.OperationalReportPrintResponse;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.user.domain.enums.FacultyEnum;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.DefaultIndexedColorMap;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

/** Read-only exports. Unknown historical facts are never derived from current copy state. */
@Component
@RequiredArgsConstructor
public class DashboardExcelExporter {
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final int MAX_ROWS = 50_000;
    private static final String UNKNOWN = "Chưa ghi nhận";
    private final NamedParameterJdbcTemplate jdbc;

    private MapSqlParameterSource parameters(DashboardReportResponse report) {
        return new MapSqlParameterSource()
            .addValue("start", Timestamp.from(report.dateFrom().atStartOfDay(ZONE).toInstant()))
            .addValue("end", Timestamp.from(report.dateTo().plusDays(1).atStartOfDay(ZONE).toInstant()))
            .addValue("from", java.sql.Date.valueOf(report.dateFrom())).addValue("to", java.sql.Date.valueOf(report.dateTo()))
            .addValue("today", java.sql.Date.valueOf(java.time.LocalDate.now(ZONE)));
    }

    public OperationalReportPrintResponse printData(DashboardReportResponse report, Long actor) {
        var p = parameters(report);
        var kpi = jdbc.queryForMap("""
            SELECT COUNT(*) FILTER (WHERE returned_date >= :start AND returned_date < :end) AS returned,
              COUNT(*) FILTER (WHERE returned_date >= :start AND returned_date < :end
                AND (returned_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date <= due_date) AS on_time,
              COUNT(*) FILTER (WHERE borrowed_date IS NOT NULL AND due_date BETWEEN :from AND :to
                AND (returned_date IS NULL OR (returned_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date > due_date)
                AND due_date < :today) AS overdue_in_period,
              COALESCE(SUM(deposit_amount) FILTER (WHERE deposit_status = 'COLLECTED'), 0) AS held
            FROM borrowing_transactions
            """, p);
        String preparedBy = jdbc.queryForObject("SELECT full_name FROM users WHERE id = :id",
            Map.of("id", actor), String.class);
        long returned = number(kpi.get("returned"));
        BigDecimal rate = returned == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(number(kpi.get("on_time")))
            .multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(returned), 1, RoundingMode.HALF_UP);
        return new OperationalReportPrintResponse(report, Instant.now(), preparedBy, rate, decimal(kpi.get("held")),
            number(kpi.get("overdue_in_period")), risks(p, 10));
    }

    // Independent aggregates avoid multiplying debt by the number of active loans.
    private List<OperationalReportPrintResponse.RiskReader> risks(MapSqlParameterSource p, int limit) {
        return jdbc.query("""
            WITH loans AS (
              SELECT user_id, COUNT(*) AS overdue_count FROM borrowing_transactions
              WHERE status IN ('BORROWING','OVERDUE') AND due_date < :today GROUP BY user_id
            ), debt AS (
              SELECT t.user_id, SUM(f.fine_amount) AS amount FROM fines f
              JOIN borrowing_transactions t ON t.id = f.transaction_id
              WHERE f.payment_status = 'UNPAID' GROUP BY t.user_id
            )
            SELECT u.student_id, u.full_name, u.faculty, u.email, u.phone_number, u.credit_score,
              COALESCE(l.overdue_count, 0) AS overdue_count, COALESCE(d.amount, 0) AS debt
            FROM users u LEFT JOIN loans l ON l.user_id = u.id LEFT JOIN debt d ON d.user_id = u.id
            WHERE COALESCE(l.overdue_count, 0) > 0 OR COALESCE(d.amount, 0) > 0 OR u.credit_score < 100
            ORDER BY overdue_count DESC, debt DESC, u.credit_score ASC, u.id
            LIMIT :limit
            """, new MapSqlParameterSource(p.getValues()).addValue("limit", limit), (rs, row) ->
                new OperationalReportPrintResponse.RiskReader(rs.getString("student_id"), rs.getString("full_name"),
                    facultyName(rs.getString("faculty")), rs.getString("email"), rs.getString("phone_number"), rs.getLong("overdue_count"),
                    rs.getBigDecimal("debt"), rs.getInt("credit_score")));
    }

    private static String facultyName(String raw) {
        if (raw == null || raw.isBlank()) return UNKNOWN;
        try { return FacultyEnum.valueOf(raw.trim()).getName(); }
        catch (IllegalArgumentException ex) { return raw; }
    }

    public byte[] export(DashboardReportResponse report, Long actor) {
        var p = parameters(report);
        var snapshot = printData(report, actor);
        try (var book = new XSSFWorkbook(); var out = new ByteArrayOutputStream()) {
            var writer = new Writer(book);
            var summary = writer.sheet("1. Tổng quan vận hành", snapshot,
                "KPI trong kỳ; tồn mượn, cọc giữ và rủi ro là số liệu hiện tại.", "Chỉ tiêu", "Giá trị", "Ý nghĩa");
            writer.row(summary, "Tổng lượt mượn", report.circulation().borrowCount(), "Theo ngày giao sách trong kỳ");
            writer.row(summary, "Tổng lượt trả", report.circulation().returnCount(), "Theo ngày trả trong kỳ");
            writer.row(summary, "Tỷ lệ trả đúng hạn (%)", snapshot.onTimeReturnRatePercent(), "Trả đúng hạn / lượt trả trong kỳ x 100; không phải tỷ lệ trả/mượn");
            writer.row(summary, "Sách đang lưu hành", report.circulation().activeBorrowCount(), "Hiện tại: BORROWING/OVERDUE");
            writer.row(summary, "Tổng lượt quá hạn trong kỳ", snapshot.overdueInPeriod(), "Hạn trả thuộc kỳ, đã trễ tính đến lúc xuất");
            writer.row(summary, "Tổng tiền cọc đang giữ (VNĐ)", snapshot.depositsHeld(), "Cọc chưa quyết toán tại lúc xuất");
            writer.row(summary, "Tiền cọc đã hoàn (VNĐ)", report.finance().depositsRefunded(), "Sự kiện hoàn cọc trong kỳ");
            writer.row(summary, "Phí phạt phát sinh (VNĐ)", report.finance().finesCreated(), "Số tiền lưu hiện tại của khoản phạt tạo trong kỳ");
            writer.row(summary, "Phí phạt đã thanh toán (VNĐ)", report.finance().finesCollected(), "Có thể gồm cấn cọc; không coi toàn bộ là tiền mặt mới thu");
            var top = writer.sheet("2. Top 100 ấn phẩm mượn nhiều", snapshot,
                "Top 100 theo ngày giao sách trong kỳ, gom nhóm theo ấn phẩm.",
                "STT", "Mã ấn phẩm", "Tên ấn phẩm", "Số lượt mượn trong kỳ");
            var topRows = rows("""
                SELECT p.id AS publication_id, p.title, COUNT(*) AS borrow_count
                FROM borrowing_transactions t JOIN items i ON i.id = t.item_id
                JOIN publications p ON p.id = i.publication_id
                WHERE t.borrowed_date >= :start AND t.borrowed_date < :end
                GROUP BY p.id, p.title ORDER BY borrow_count DESC, p.id ASC LIMIT 100
                """, p);
            int topIndex = 0;
            for (var r : topRows) writer.row(top, ++topIndex, r.get("publication_id").toString(), r.get("title"), r.get("borrow_count"));

            var active = writer.sheet("3. Đang mượn và quá hạn", snapshot, "Toàn bộ sách đang mượn tại lúc xuất, không giới hạn ngày mượn.",
                "STT", "MSSV", "Tên bạn đọc", "Barcode", "Tên sách", "Ngày mượn", "Hạn trả", "Trạng thái", "Số ngày quá hạn", "Cọc giữ (VNĐ)", "Số lần gia hạn");
            var activeRows = rows("""
                SELECT u.student_id, u.full_name, i.barcode, p.title, t.borrowed_date, t.due_date,
                  CASE WHEN t.due_date < :today THEN 'Quá hạn' ELSE 'Đang mượn' END AS status_label,
                  GREATEST(:today - t.due_date, 0) AS overdue_days,
                  CASE WHEN t.deposit_status = 'COLLECTED' THEN t.deposit_amount ELSE 0 END AS held, t.renewal_count
                FROM borrowing_transactions t JOIN users u ON u.id=t.user_id
                JOIN items i ON i.id=t.item_id JOIN publications p ON p.id=i.publication_id
                WHERE t.status IN ('BORROWING','OVERDUE') ORDER BY t.due_date, t.id LIMIT 50001
                """, p);
            int index = 0;
            for (var r : activeRows) writer.row(active, ++index, r.get("student_id"), r.get("full_name"), r.get("barcode"), r.get("title"),
                r.get("borrowed_date"), r.get("due_date"), r.get("status_label"), r.get("overdue_days"), r.get("held"), r.get("renewal_count"));

            var returned = writer.sheet("4. Sách đã trả trong kỳ", snapshot, "Chưa có snapshot tình trạng khi trả; không sử dụng tình trạng hiện tại của bản sao.",
                "STT", "MSSV", "Tên bạn đọc", "Barcode", "Tên sách", "Ngày mượn", "Ngày trả", "Thủ thư tiếp nhận", "Tình trạng khi trả", "Cọc đã hoàn (VNĐ)", "Phí trễ-hỏng (VNĐ)");
            var returnedRows = rows("""
                SELECT u.student_id, u.full_name, i.barcode, p.title, t.borrowed_date, t.returned_date,
                  staff.full_name AS received_by, t.deposit_refund_amount,
                  (SELECT COALESCE(SUM(f.fine_amount),0) FROM fines f WHERE f.transaction_id=t.id
                    AND f.type IN ('OVERDUE_RETURN','DAMAGED_BOOK')) AS fines
                FROM borrowing_transactions t JOIN users u ON u.id=t.user_id
                JOIN items i ON i.id=t.item_id JOIN publications p ON p.id=i.publication_id
                LEFT JOIN users staff ON staff.id=t.librarian_id_return
                WHERE t.returned_date >= :start AND t.returned_date < :end ORDER BY t.returned_date, t.id LIMIT 50001
                """, p);
            index = 0;
            for (var r : returnedRows) writer.row(returned, ++index, r.get("student_id"), r.get("full_name"), r.get("barcode"), r.get("title"),
                r.get("borrowed_date"), r.get("returned_date"), r.get("received_by"), UNKNOWN, r.get("deposit_refund_amount"), r.get("fines"));

            var audit = writer.sheet("5. Đối soát cọc và phí", snapshot,
                "Nhật ký gồm phát sinh nợ, thanh toán và cấn cọc: KHÔNG cộng tất cả dòng thành doanh thu. Tiền mặt chưa được ghi nhận riêng.",
                "Mã GD - Biên lai", "Thời gian", "MSSV", "Loại giao dịch", "Số tiền (VNĐ)", "Hình thức", "Thủ thư thực hiện", "Ghi chú");
            for (var r : rows(AUDIT_SQL, p)) writer.row(audit, r.get("receipt"), r.get("occurred_at"), r.get("student_id"),
                r.get("event"), r.get("amount"), r.get("method"), r.get("actor"), r.get("note"));

            var risk = writer.sheet("6. Bạn đọc cần theo dõi", snapshot, "Toàn bộ hồ sơ có quá hạn, nợ phạt hoặc tín nhiệm dưới 100 tại lúc xuất; khoa có sẵn, lớp chưa ghi nhận.",
                "MSSV", "Họ tên", "Khoa", "Email", "SĐT", "Sách quá hạn", "Phạt chưa thanh toán (VNĐ)", "Điểm tín nhiệm");
            var readers = risks(p, MAX_ROWS + 1);
            checkSize(readers.size());
            for (var r : readers) writer.row(risk, r.studentId(), r.fullName(), r.faculty(), r.email(), r.phoneNumber(), r.overdueCount(), r.totalUnpaidAmount(), r.creditScore());
            writer.finish(); book.write(out); return out.toByteArray();
        } catch (IOException ex) { throw new IllegalStateException("Không thể xuất báo cáo Excel", ex); }
    }

    private static final String AUDIT_SQL = """
        SELECT * FROM (
          SELECT 'DEP-' || e.id::text || ' / GD-' || e.transaction_id::text AS receipt, e.created_at AS occurred_at,
            u.student_id, CASE e.event_type WHEN 'COLLECTED' THEN 'Thu cọc' WHEN 'REFUNDED' THEN 'Hoàn cọc'
              WHEN 'APPLIED_TO_FINE' THEN 'Cấn cọc vào phạt' ELSE 'Nợ phạt vượt cọc (không phải thu tiền)' END AS event,
            e.amount, CASE WHEN e.event_type='APPLIED_TO_FINE' THEN 'Trừ cọc' ELSE 'Chưa ghi nhận' END AS method,
            staff.full_name AS actor, e.note
          FROM borrow_deposit_events e JOIN users u ON u.id=e.user_id LEFT JOIN users staff ON staff.id=e.librarian_id
          WHERE e.created_at >= :start AND e.created_at < :end
          UNION ALL
          SELECT 'FINE-' || f.id::text || ' / GD-' || t.id::text, f.created_at, u.student_id,
            CASE f.type WHEN 'OVERDUE_RETURN' THEN 'Phạt trễ hạn - phát sinh' ELSE 'Phạt bồi thường - phát sinh' END,
            f.fine_amount, 'Phát sinh công nợ', NULL, 'Số tiền hiện tại; có thể đã điều chỉnh/cấn cọc, không phải dòng tiền'
          FROM fines f JOIN borrowing_transactions t ON t.id=f.transaction_id JOIN users u ON u.id=t.user_id
          WHERE f.created_at >= :start AND f.created_at < :end
          UNION ALL
          SELECT 'PAID-' || f.id::text || ' / GD-' || t.id::text, f.paid_date, u.student_id, 'Phí phạt đã thanh toán',
            f.fine_amount, CASE WHEN EXISTS (SELECT 1 FROM fine_payment_order_fines ofn JOIN fine_payment_orders po ON po.id=ofn.order_id
              WHERE ofn.fine_id=f.id AND po.status='PAID') THEN 'Chuyển khoản (PAYOS)' ELSE 'Chưa ghi nhận (có thể gồm cấn cọc)' END,
            staff.full_name, 'Không cộng với dòng cấn cọc: hệ thống chưa lưu phân bổ cấn cọc theo từng khoản phạt'
          FROM fines f JOIN borrowing_transactions t ON t.id=f.transaction_id JOIN users u ON u.id=t.user_id
          LEFT JOIN users staff ON staff.id=f.paid_by_librarian_id
          WHERE f.payment_status='PAID' AND f.paid_date >= :start AND f.paid_date < :end
        ) events ORDER BY occurred_at, receipt LIMIT 50001
        """;

    private List<Map<String,Object>> rows(String sql, MapSqlParameterSource p) {
        var rows = jdbc.queryForList(sql, p); checkSize(rows.size()); return rows;
    }
    private void checkSize(int size) {
        if (size > MAX_ROWS) throw new AppException(ErrorCode.INVALID_REQUEST);
    }
    private static long number(Object value) { return value == null ? 0 : ((Number)value).longValue(); }
    private static BigDecimal decimal(Object value) { return value == null ? BigDecimal.ZERO : new BigDecimal(value.toString()); }

    private static class Writer {
        private final XSSFWorkbook book;
        private final CellStyle header, body, numeric;
        Writer(XSSFWorkbook book) {
            this.book = book;
            book.getFontAt(0).setFontName("Times New Roman");
            XSSFFont bodyFont = book.createFont(); bodyFont.setFontName("Times New Roman");
            body = book.createCellStyle(); body.setWrapText(true); body.setVerticalAlignment(VerticalAlignment.TOP);
            body.setFont(bodyFont);
            body.setBorderBottom(BorderStyle.THIN); body.setBorderTop(BorderStyle.THIN);
            body.setBorderLeft(BorderStyle.THIN); body.setBorderRight(BorderStyle.THIN);
            var headerStyle = book.createCellStyle(); headerStyle.cloneStyleFrom(body);
            headerStyle.setFillForegroundColor(new XSSFColor(new byte[]{0x15, (byte) 0x80, 0x3D}, new DefaultIndexedColorMap()));
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            XSSFFont font = book.createFont(); font.setFontName("Times New Roman");
            font.setBold(true); font.setColor(IndexedColors.WHITE.getIndex()); headerStyle.setFont(font);
            header = headerStyle;
            numeric = book.createCellStyle(); numeric.cloneStyleFrom(body); numeric.setDataFormat(book.createDataFormat().getFormat("#,##0.##"));
        }
        Sheet sheet(String name, OperationalReportPrintResponse info, String note, String... columns) {
            var sheet = book.createSheet(name);
            // Excel freezes every row above the split, so put the column header first.
            // Report metadata/notes remain available in Page Layout and Print Preview.
            String exportedAt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss").withZone(ZONE).format(info.generatedAt());
            sheet.getHeader().setCenter("&\"Times New Roman,Regular\"&10BÁO CÁO VẬN HÀNH VÀ LƯU THÔNG THƯ VIỆN\n"
                + "Kỳ báo cáo: " + info.report().dateFrom() + " — " + info.report().dateTo()
                + "\nThời điểm xuất (Việt Nam): " + exportedAt + "\nNgười lập: " + info.preparedBy().replace("&", "&&"));
            sheet.getFooter().setCenter("&\"Times New Roman,Regular\"&9" + note.replace("&", "&&"));
            sheet.setMargin(PageMargin.TOP, 1.0);
            sheet.setMargin(PageMargin.BOTTOM, 0.8);
            row(sheet, (Object[])columns);
            for (var cell : sheet.getRow(0)) cell.setCellStyle(header);
            sheet.getRow(0).setHeightInPoints(36); sheet.createFreezePane(0, 1);
            sheet.setDisplayGridlines(false);
            sheet.getPrintSetup().setLandscape(true);
            sheet.getPrintSetup().setPaperSize(PrintSetup.A4_PAPERSIZE);
            sheet.getPrintSetup().setFitWidth((short) 1);
            sheet.getPrintSetup().setFitHeight((short) 0);
            sheet.setFitToPage(true);
            return sheet;
        }
        void row(Sheet sheet, Object... values) {
            var row = sheet.createRow(sheet.getPhysicalNumberOfRows());
            for (int i=0; i<values.length; i++) {
                var cell = row.createCell(i); Object value=values[i]; cell.setCellStyle(body);
                if (value instanceof Number n) { cell.setCellValue(n.doubleValue()); cell.setCellStyle(numeric); }
                else if (value instanceof java.sql.Timestamp ts) cell.setCellValue(ts.toInstant().atZone(ZONE).format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
                else if (value instanceof java.util.Date d) cell.setCellValue(d.toString());
                else cell.setCellValue(value == null ? UNKNOWN : value.toString()); // Never formula cells, including user text starting with '='.
            }
        }
        void finish() {
            for (var sheet : book) {
                int columns = sheet.getRow(0).getLastCellNum();
                sheet.setAutoFilter(new CellRangeAddress(0, sheet.getLastRowNum(), 0, columns-1));
                for (int i=0; i<columns; i++) { sheet.autoSizeColumn(i); sheet.setColumnWidth(i, Math.min(60*256, Math.max(15*256, sheet.getColumnWidth(i)))); }
                sheet.setRepeatingRows(new CellRangeAddress(0,0,-1,-1));
            }
        }
    }
}
