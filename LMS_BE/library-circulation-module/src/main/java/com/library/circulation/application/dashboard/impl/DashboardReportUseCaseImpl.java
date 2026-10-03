package com.library.circulation.application.dashboard.impl;

import com.library.circulation.application.dashboard.DashboardReportUseCase;
import com.library.circulation.dto.enums.ReportPeriod;
import com.library.circulation.dto.response.DashboardReportResponse;
import com.library.circulation.dto.response.OperationalReportPrintResponse;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardReportUseCaseImpl implements DashboardReportUseCase {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter GENERATED_AT_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z");

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final DashboardExcelExporter excelExporter;

    @Override
    @Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.REPEATABLE_READ)
    public byte[] exportExcel(LocalDate from, LocalDate to, Long librarianId) {
        validateExportRange(from, to);
        var report = execute(ReportPeriod.CUSTOM, from, to);
        return excelExporter.export(report, librarianId);
    }

    @Override
    @Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.REPEATABLE_READ)
    public OperationalReportPrintResponse printReport(LocalDate from, LocalDate to, Long librarianId) {
        validateExportRange(from, to);
        return excelExporter.printData(execute(ReportPeriod.CUSTOM, from, to), librarianId);
    }

    private void validateExportRange(LocalDate from, LocalDate to) {
        if (from == null || to == null || from.isAfter(to) || from.plusYears(5).isBefore(to)) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardReportResponse execute(ReportPeriod period, LocalDate dateFrom, LocalDate dateTo) {
        DateRange range = resolveRange(period, dateFrom, dateTo);
        MapSqlParameterSource params = params(range);

        DashboardReportResponse.InventorySection inventory = fetchInventory(params);
        DashboardReportResponse.CirculationSection circulation = fetchCirculation(params);
        DashboardReportResponse.FinanceSection finance = fetchFinance(params);
        DashboardReportResponse.IncidentSection incidents = fetchIncidents(params);
        List<DashboardReportResponse.TrendRow> trend = fetchTrend(range, params);
        List<DashboardReportResponse.TopBorrowedPublication> topBorrowed = fetchTopBorrowed(params);
        List<DashboardReportResponse.RiskyReaderRow> riskyReaders = fetchRiskyReaders();

        return DashboardReportResponse.builder()
            .dateFrom(range.from())
            .dateTo(range.to())
            .inventory(inventory)
            .circulation(circulation)
            .finance(finance)
            .incidents(incidents)
            .trend(trend)
            .topBorrowedPublications(topBorrowed)
            .riskyReaders(riskyReaders)
            .librarianNotes(buildNotes(circulation, finance, incidents))
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportCsv(ReportPeriod period, LocalDate dateFrom, LocalDate dateTo) {
        DashboardReportResponse report = execute(period, dateFrom, dateTo);
        long operationalPressure = report.circulation().overdueCurrentCount()
            + report.circulation().waitingPickupCount()
            + report.circulation().reservationPendingCount();
        long incidentTotal = report.incidents().overdueFineCount()
            + report.incidents().damagedFineCount()
            + report.incidents().lostFineCount();
        BigDecimal availableRate = percent(report.inventory().availableItems(), report.inventory().totalItems());
        BigDecimal collectionRate = percent(report.finance().finesCollected(), report.finance().finesCreated());
        StringBuilder csv = new StringBuilder("\uFEFF");
        appendRow(csv, "BÁO CÁO ĐIỀU HÀNH THƯ VIỆN", "", "");
        appendRow(csv, "Từ ngày", report.dateFrom().toString(), "Đến ngày", report.dateTo().toString());
        appendRow(csv, "Thời điểm xuất", ZonedDateTime.now(ZONE).format(GENERATED_AT_FORMAT), "Múi giờ", ZONE.toString());
        appendRow(csv, "Đơn vị tiền tệ", "VND", "Encoding", "UTF-8 BOM");
        blank(csv);

        appendRow(csv, "0. TÓM TẮT ĐIỀU HÀNH");
        appendRow(csv, "Chỉ tiêu", "Giá trị", "Ghi chú");
        appendRow(csv, "Sức ép vận hành", operationalPressure, "Quá hạn + chờ lấy + đặt trước đang chờ");
        appendRow(csv, "Tỷ lệ kho khả dụng", availableRate + "%", "Có sẵn / tổng bản sao");
        appendRow(csv, "Tỷ lệ trả/mượn", report.circulation().returnRatePercent() + "%", "Lượt trả chia lượt mượn trong kỳ");
        appendRow(csv, "Tỷ lệ thu phí", collectionRate + "%", "Phí đã thu / phí phát sinh trong kỳ");
        appendRow(csv, "Tiền cần thu", money(report.finance().unpaidFineOutstanding()), "Nợ phạt còn tồn hiện tại");
        appendRow(csv, "Tổng sự cố trong kỳ", incidentTotal, "Quá hạn + hư hỏng + mất sách");
        appendRow(csv, "Bạn đọc rủi ro đang liệt kê", report.riskyReaders().size(), "Top hồ sơ cần ưu tiên theo điểm tín dụng và công nợ");
        blank(csv);

        appendRow(csv, "1. TỔNG QUAN KHO SÁCH");
        appendRow(csv, "Chỉ tiêu", "Số lượng", "Ghi chú");
        appendRow(csv, "Tổng bản sao hiện có", report.inventory().totalItems(), "Tất cả trạng thái");
        appendRow(csv, "Có sẵn", report.inventory().availableItems(), "Có thể cho mượn");
        appendRow(csv, "Đang mượn", report.inventory().borrowedItems(), "Đang nằm ngoài kho");
        appendRow(csv, "Đang đặt trước", report.inventory().reservedItems(), "Đang giữ cho bạn đọc");
        appendRow(csv, "Bảo trì", report.inventory().maintenanceItems(), "Cần xử lý trước khi lưu thông");
        appendRow(csv, "Mất/thất lạc", report.inventory().lostItems(), "Không thể lưu thông");
        appendRow(csv, "Bản sao nhập kho trong kỳ", report.inventory().itemsAddedInPeriod(), "Theo ngày tạo bản sao");
        appendRow(csv, "Đầu sách thêm trong kỳ", report.inventory().publicationsAddedInPeriod(), "Theo ngày tạo đầu sách");
        blank(csv);

        appendRow(csv, "2. MƯỢN TRẢ VÀ NHU CẦU SỬ DỤNG");
        appendRow(csv, "Chỉ tiêu", "Số lượng", "Ghi chú");
        appendRow(csv, "Lượt mượn trong kỳ", report.circulation().borrowCount(), "Theo ngày giao sách");
        appendRow(csv, "Lượt trả trong kỳ", report.circulation().returnCount(), "Theo ngày trả sách");
        appendRow(csv, "Tỷ lệ trả/mượn", report.circulation().returnRatePercent() + "%", "Lượt trả chia lượt mượn");
        appendRow(csv, "Đang mượn hiện tại", report.circulation().activeBorrowCount(), "BORROWING/OVERDUE");
        appendRow(csv, "Quá hạn hiện tại", report.circulation().overdueCurrentCount(), "Cần nhắc trả");
        appendRow(csv, "Chờ lấy sách", report.circulation().waitingPickupCount(), "Cần xác nhận giao sách");
        appendRow(csv, "Đặt trước đang chờ", report.circulation().reservationPendingCount(), "Hàng chờ đặt trước");
        blank(csv);

        appendRow(csv, "3. TÀI CHÍNH CỌC VÀ PHÍ");
        appendRow(csv, "Chỉ tiêu", "Số tiền (VND)", "Ý nghĩa");
        appendRow(csv, "Cọc đã thu", money(report.finance().depositsCollected()), "Tiền cọc nhận tại quầy");
        appendRow(csv, "Cọc đã hoàn", money(report.finance().depositsRefunded()), "Tiền hoàn lại bạn đọc");
        appendRow(csv, "Cọc đã cấn phạt", money(report.finance().depositsAppliedToFines()), "Cọc dùng bù phí");
        appendRow(csv, "Thu thêm sau cấn cọc", money(report.finance().additionalAmountDue()), "Phần phí vượt cọc");
        appendRow(csv, "Phí phạt phát sinh", money(report.finance().finesCreated()), "Theo ngày tạo phí");
        appendRow(csv, "Phí phạt đã thu", money(report.finance().finesCollected()), "Theo ngày thanh toán");
        appendRow(csv, "Nợ phạt còn tồn", money(report.finance().unpaidFineOutstanding()), "Tổng nợ hiện tại");
        appendRow(csv, "Hoàn do tìm lại sách mất", money(report.finance().lostBookRefunds()), "Theo ghi nhận phục hồi");
        appendRow(csv, "Dòng tiền ròng trong kỳ", money(report.finance().netCashInPeriod()), "Cọc thu + phí thu - cọc hoàn - hoàn sách mất");
        blank(csv);

        appendRow(csv, "4. SỰ CỐ VÀ VI PHẠM");
        appendRow(csv, "Loại", "Số vụ", "Ghi chú");
        appendRow(csv, "Quá hạn", report.incidents().overdueFineCount(), "Khoản phí quá hạn");
        appendRow(csv, "Hư hỏng", report.incidents().damagedFineCount(), "Khoản phí hư hỏng");
        appendRow(csv, "Mất sách", report.incidents().lostFineCount(), "Khoản phí mất sách");
        appendRow(csv, "Tìm lại sách mất", report.incidents().recoveredLostBookCount(), "Số bản sao phục hồi");
        blank(csv);

        appendRow(csv, "5. TOP SÁCH ĐƯỢC MƯỢN");
        appendRow(csv, "STT", "Mã ấn phẩm", "Tên sách", "Lượt mượn");
        for (int i = 0; i < report.topBorrowedPublications().size(); i++) {
            var row = report.topBorrowedPublications().get(i);
            appendRow(csv, i + 1, row.publicationId(), row.title(), row.borrowCount());
        }
        blank(csv);

        appendRow(csv, "6. BẠN ĐỌC RỦI RO CẦN THEO DÕI");
        appendRow(csv, "STT", "Mã bạn đọc", "Họ tên", "Email", "Số điện thoại", "Điểm tín dụng", "Đang quá hạn", "Khoản phạt chưa trả", "Tổng nợ phạt (VND)", "Số lần hư hỏng");
        for (int i = 0; i < report.riskyReaders().size(); i++) {
            var row = report.riskyReaders().get(i);
            appendRow(csv, i + 1, valueOrEmpty(row.studentId()), row.fullName(), row.email(), valueOrEmpty(row.phoneNumber()),
                row.creditScore(), row.overdueCount(), row.unpaidFineCount(), money(row.totalUnpaidAmount()), row.damagedCount());
        }
        blank(csv);

        appendRow(csv, "7. GỢI Ý NỘI DUNG BÁO CÁO");
        for (String note : report.librarianNotes()) appendRow(csv, "-", note);
        blank(csv);

        appendRow(csv, "8. DỮ LIỆU THEO THỜI GIAN");
        appendRow(csv, "Mốc", "Lượt mượn", "Lượt trả", "Cọc thu", "Phí thu");
        for (var row : report.trend()) {
            appendRow(csv, row.label(), row.borrowed(), row.returned(), money(row.depositsCollected()), money(row.finesCollected()));
        }
        blank(csv);

        appendRow(csv, "9. ĐỊNH NGHĨA CHỈ SỐ");
        appendRow(csv, "Chỉ số", "Cách tính", "Ghi chú nghiệp vụ");
        appendRow(csv, "Sức ép vận hành", "Quá hạn hiện tại + chờ lấy sách + đặt trước đang chờ", "Dùng để ưu tiên ca trực");
        appendRow(csv, "Tỷ lệ trả/mượn", "Lượt trả trong kỳ / lượt mượn trong kỳ x 100", "0% nếu không có lượt mượn");
        appendRow(csv, "Tỷ lệ kho khả dụng", "Bản sao có sẵn / tổng bản sao x 100", "Phản ánh năng lực phục vụ ngay");
        appendRow(csv, "Tỷ lệ thu phí", "Phí phạt đã thu / phí phạt phát sinh x 100", "Có thể trên 100% nếu thu khoản phát sinh từ kỳ trước");
        appendRow(csv, "Dòng tiền ròng", "Cọc đã thu + phí đã thu - cọc đã hoàn - hoàn do tìm lại sách mất", "Không trừ cọc đã cấn phạt để tránh đếm trùng dòng tiền");
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private DashboardReportResponse.InventorySection fetchInventory(MapSqlParameterSource params) {
        Map<String, Object> row = jdbcTemplate.queryForMap("""
            SELECT
              COUNT(*) AS total_items,
              COUNT(*) FILTER (WHERE status = 'AVAILABLE') AS available_items,
              COUNT(*) FILTER (WHERE status = 'BORROWED') AS borrowed_items,
              COUNT(*) FILTER (WHERE status = 'RESERVED') AS reserved_items,
              COUNT(*) FILTER (WHERE status = 'IN_MAINTENANCE') AS maintenance_items,
              COUNT(*) FILTER (WHERE status = 'LOST') AS lost_items,
              COUNT(*) FILTER (WHERE created_at >= :start AND created_at < :end) AS items_added
            FROM items
            """, params);
        Long publicationsAdded = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM publications WHERE created_at >= :start AND created_at < :end",
            params, Long.class);
        return DashboardReportResponse.InventorySection.builder()
            .totalItems(toLong(row.get("total_items")))
            .availableItems(toLong(row.get("available_items")))
            .borrowedItems(toLong(row.get("borrowed_items")))
            .reservedItems(toLong(row.get("reserved_items")))
            .maintenanceItems(toLong(row.get("maintenance_items")))
            .lostItems(toLong(row.get("lost_items")))
            .itemsAddedInPeriod(toLong(row.get("items_added")))
            .publicationsAddedInPeriod(publicationsAdded == null ? 0 : publicationsAdded)
            .build();
    }

    private DashboardReportResponse.CirculationSection fetchCirculation(MapSqlParameterSource params) {
        Map<String, Object> row = jdbcTemplate.queryForMap("""
            SELECT
              COUNT(*) FILTER (WHERE borrowed_date >= :start AND borrowed_date < :end) AS borrow_count,
              COUNT(*) FILTER (WHERE returned_date >= :start AND returned_date < :end) AS return_count,
              COUNT(*) FILTER (WHERE status IN ('BORROWING', 'OVERDUE')) AS active_borrow_count,
              COUNT(*) FILTER (WHERE status = 'OVERDUE') AS overdue_current_count,
              COUNT(*) FILTER (WHERE status = 'WAITING_FOR_PICKUP') AS waiting_pickup_count
            FROM borrowing_transactions
            """, params);
        Long reservationsPending = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM reservations WHERE status = 'PENDING'", params, Long.class);
        long borrowCount = toLong(row.get("borrow_count"));
        long returnCount = toLong(row.get("return_count"));
        BigDecimal returnRate = borrowCount == 0
            ? BigDecimal.ZERO
            : BigDecimal.valueOf(returnCount).multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(borrowCount), 1, RoundingMode.HALF_UP);
        return DashboardReportResponse.CirculationSection.builder()
            .borrowCount(borrowCount)
            .returnCount(returnCount)
            .activeBorrowCount(toLong(row.get("active_borrow_count")))
            .overdueCurrentCount(toLong(row.get("overdue_current_count")))
            .waitingPickupCount(toLong(row.get("waiting_pickup_count")))
            .reservationPendingCount(reservationsPending == null ? 0 : reservationsPending)
            .returnRatePercent(returnRate)
            .build();
    }

    private DashboardReportResponse.FinanceSection fetchFinance(MapSqlParameterSource params) {
        Map<String, Object> deposits = jdbcTemplate.queryForMap("""
            SELECT
              COALESCE(SUM(amount) FILTER (WHERE event_type = 'COLLECTED'), 0) AS deposits_collected,
              COALESCE(SUM(amount) FILTER (WHERE event_type = 'REFUNDED'), 0) AS deposits_refunded,
              COALESCE(SUM(amount) FILTER (WHERE event_type = 'APPLIED_TO_FINE'), 0) AS deposits_applied,
              COALESCE(SUM(amount) FILTER (WHERE event_type = 'ADDITIONAL_DUE'), 0) AS additional_due
            FROM borrow_deposit_events
            WHERE created_at >= :start AND created_at < :end
            """, params);
        Map<String, Object> fines = jdbcTemplate.queryForMap("""
            SELECT
              COALESCE(SUM(fine_amount) FILTER (WHERE created_at >= :start AND created_at < :end), 0) AS fines_created,
              COALESCE(SUM(fine_amount) FILTER (WHERE payment_status = 'PAID' AND paid_date >= :start AND paid_date < :end), 0) AS fines_collected,
              COALESCE(SUM(fine_amount) FILTER (WHERE payment_status = 'UNPAID'), 0) AS unpaid_outstanding
            FROM fines
            """, params);
        BigDecimal lostRefunds = jdbcTemplate.queryForObject("""
            SELECT COALESCE(SUM(refund_amount), 0)
            FROM lost_book_recoveries
            WHERE created_at >= :start AND created_at < :end
            """, params, BigDecimal.class);
        BigDecimal depositsCollected = toBigDecimal(deposits.get("deposits_collected"));
        BigDecimal depositsRefunded = toBigDecimal(deposits.get("deposits_refunded"));
        BigDecimal finesCollected = toBigDecimal(fines.get("fines_collected"));
        BigDecimal refunds = lostRefunds == null ? BigDecimal.ZERO : lostRefunds;
        BigDecimal netCash = depositsCollected.add(finesCollected).subtract(depositsRefunded).subtract(refunds);
        return DashboardReportResponse.FinanceSection.builder()
            .depositsCollected(depositsCollected)
            .depositsRefunded(depositsRefunded)
            .depositsAppliedToFines(toBigDecimal(deposits.get("deposits_applied")))
            .additionalAmountDue(toBigDecimal(deposits.get("additional_due")))
            .finesCreated(toBigDecimal(fines.get("fines_created")))
            .finesCollected(finesCollected)
            .unpaidFineOutstanding(toBigDecimal(fines.get("unpaid_outstanding")))
            .lostBookRefunds(refunds)
            .netCashInPeriod(netCash)
            .build();
    }

    private DashboardReportResponse.IncidentSection fetchIncidents(MapSqlParameterSource params) {
        Map<String, Object> row = jdbcTemplate.queryForMap("""
            SELECT
              COUNT(*) FILTER (WHERE type = 'OVERDUE_RETURN') AS overdue_count,
              COUNT(*) FILTER (WHERE type = 'DAMAGED_BOOK') AS damaged_count,
              COUNT(*) FILTER (WHERE type = 'LOST_BOOK') AS lost_count
            FROM fines
            WHERE created_at >= :start AND created_at < :end
            """, params);
        Long recovered = jdbcTemplate.queryForObject("""
            SELECT COUNT(*) FROM lost_book_recoveries
            WHERE created_at >= :start AND created_at < :end
            """, params, Long.class);
        return DashboardReportResponse.IncidentSection.builder()
            .overdueFineCount(toLong(row.get("overdue_count")))
            .damagedFineCount(toLong(row.get("damaged_count")))
            .lostFineCount(toLong(row.get("lost_count")))
            .recoveredLostBookCount(recovered == null ? 0 : recovered)
            .build();
    }

    private List<DashboardReportResponse.TrendRow> fetchTrend(DateRange range, MapSqlParameterSource params) {
        boolean monthly = range.from().plusDays(45).isBefore(range.to());
        String bucketExpr = monthly
            ? "DATE_TRUNC('month', bucket_date)::date"
            : "bucket_date";
        String seriesSql = monthly
            ? "SELECT generate_series(DATE_TRUNC('month', :dateFrom::date), DATE_TRUNC('month', :dateTo::date), '1 month'::interval)::date AS bucket_date"
            : "SELECT generate_series(:dateFrom::date, :dateTo::date, '1 day'::interval)::date AS bucket_date";
        String label = monthly ? "TO_CHAR(b.bucket, 'YYYY-MM')" : "TO_CHAR(b.bucket, 'YYYY-MM-DD')";

        return jdbcTemplate.query("""
            WITH raw_buckets AS (
                %s
            ),
            buckets AS (
                SELECT %s AS bucket FROM raw_buckets GROUP BY 1
            ),
            borrowed AS (
                SELECT %s AS bucket, COUNT(*) AS cnt
                FROM (SELECT (borrowed_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS bucket_date FROM borrowing_transactions WHERE borrowed_date >= :start AND borrowed_date < :end) s
                GROUP BY 1
            ),
            returned AS (
                SELECT %s AS bucket, COUNT(*) AS cnt
                FROM (SELECT (returned_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS bucket_date FROM borrowing_transactions WHERE returned_date >= :start AND returned_date < :end) s
                GROUP BY 1
            ),
            deposits AS (
                SELECT %s AS bucket,
                       COALESCE(SUM(amount) FILTER (WHERE event_type = 'COLLECTED'), 0) AS deposits_collected
                FROM (SELECT (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS bucket_date, event_type, amount FROM borrow_deposit_events WHERE created_at >= :start AND created_at < :end) s
                GROUP BY 1
            ),
            fines_paid AS (
                SELECT %s AS bucket, COALESCE(SUM(fine_amount), 0) AS fines_collected
                FROM (SELECT (paid_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS bucket_date, fine_amount FROM fines WHERE payment_status = 'PAID' AND paid_date >= :start AND paid_date < :end) s
                GROUP BY 1
            )
            SELECT %s AS label,
                   COALESCE(bor.cnt, 0) AS borrowed,
                   COALESCE(ret.cnt, 0) AS returned,
                   COALESCE(dep.deposits_collected, 0) AS deposits_collected,
                   COALESCE(fp.fines_collected, 0) AS fines_collected
            FROM buckets b
            LEFT JOIN borrowed bor ON bor.bucket = b.bucket
            LEFT JOIN returned ret ON ret.bucket = b.bucket
            LEFT JOIN deposits dep ON dep.bucket = b.bucket
            LEFT JOIN fines_paid fp ON fp.bucket = b.bucket
            ORDER BY b.bucket
            """.formatted(seriesSql, bucketExpr, bucketExpr, bucketExpr, bucketExpr, bucketExpr, label),
            params, (rs, i) -> DashboardReportResponse.TrendRow.builder()
                .label(rs.getString("label"))
                .borrowed(rs.getLong("borrowed"))
                .returned(rs.getLong("returned"))
                .depositsCollected(rs.getBigDecimal("deposits_collected"))
                .finesCollected(rs.getBigDecimal("fines_collected"))
                .build());
    }

    private List<DashboardReportResponse.TopBorrowedPublication> fetchTopBorrowed(MapSqlParameterSource params) {
        return jdbcTemplate.query("""
            SELECT p.id, p.title, COUNT(bt.id) AS borrow_count
            FROM publications p
            JOIN items i ON i.publication_id = p.id
            JOIN borrowing_transactions bt ON bt.item_id = i.id
            WHERE bt.borrowed_date >= :start AND bt.borrowed_date < :end
            GROUP BY p.id, p.title
            ORDER BY borrow_count DESC, p.title ASC
            LIMIT 10
            """, params, (rs, i) -> DashboardReportResponse.TopBorrowedPublication.builder()
                .publicationId(rs.getLong("id"))
                .title(rs.getString("title"))
                .borrowCount(rs.getLong("borrow_count"))
                .build());
    }

    private List<DashboardReportResponse.RiskyReaderRow> fetchRiskyReaders() {
        return jdbcTemplate.query("""
            SELECT
              u.id AS user_id,
              u.student_id,
              u.full_name,
              u.email,
              u.phone_number,
              u.credit_score,
              COUNT(DISTINCT bt.id) FILTER (WHERE bt.status = 'OVERDUE') AS overdue_count,
              COUNT(DISTINCT f.id) FILTER (WHERE f.payment_status = 'UNPAID') AS unpaid_fine_count,
              COALESCE(SUM(f.fine_amount) FILTER (WHERE f.payment_status = 'UNPAID'), 0) AS total_unpaid_amount,
              COUNT(DISTINCT f.id) FILTER (WHERE f.type = 'DAMAGED_BOOK') AS damaged_count
            FROM users u
            LEFT JOIN borrowing_transactions bt ON bt.user_id = u.id
            LEFT JOIN fines f ON f.transaction_id = bt.id
            GROUP BY u.id, u.student_id, u.full_name, u.email, u.phone_number, u.credit_score
            HAVING
              COUNT(DISTINCT f.id) FILTER (WHERE f.payment_status = 'UNPAID') > 0
              OR COUNT(DISTINCT bt.id) FILTER (WHERE bt.status = 'OVERDUE') > 0
              OR u.credit_score < 100
            ORDER BY u.credit_score ASC, total_unpaid_amount DESC, overdue_count DESC, u.full_name ASC
            LIMIT 20
            """, Map.of(), (rs, i) -> DashboardReportResponse.RiskyReaderRow.builder()
                .userId(rs.getLong("user_id"))
                .studentId(rs.getString("student_id"))
                .fullName(rs.getString("full_name"))
                .email(rs.getString("email"))
                .phoneNumber(rs.getString("phone_number"))
                .creditScore(rs.getInt("credit_score"))
                .overdueCount(rs.getLong("overdue_count"))
                .unpaidFineCount(rs.getLong("unpaid_fine_count"))
                .totalUnpaidAmount(rs.getBigDecimal("total_unpaid_amount"))
                .damagedCount(rs.getLong("damaged_count"))
                .build());
    }

    private List<String> buildNotes(
        DashboardReportResponse.CirculationSection circulation,
        DashboardReportResponse.FinanceSection finance,
        DashboardReportResponse.IncidentSection incidents
    ) {
        List<String> notes = new ArrayList<>();
        notes.add("Trong kỳ có " + circulation.borrowCount() + " lượt mượn và " + circulation.returnCount()
            + " lượt trả; tỷ lệ trả/mượn là " + circulation.returnRatePercent() + "%.");
        notes.add("Hiện còn " + circulation.overdueCurrentCount() + " giao dịch quá hạn và "
            + circulation.waitingPickupCount() + " phiếu chờ lấy sách cần thủ thư xử lý.");
        notes.add("Dòng tiền ròng trong kỳ là " + money(finance.netCashInPeriod())
            + " VND, bao gồm cọc thu, phí thu và các khoản hoàn.");
        if (incidents.lostFineCount() > 0 || incidents.damagedFineCount() > 0) {
            notes.add("Có " + incidents.damagedFineCount() + " vụ hư hỏng và " + incidents.lostFineCount()
                + " vụ mất sách; nên đối chiếu với tình trạng bản sao trước khi lập báo cáo cuối kỳ.");
        }
        return notes;
    }

    private DateRange resolveRange(ReportPeriod period, LocalDate from, LocalDate to) {
        LocalDate today = LocalDate.now(ZONE);
        LocalDate end = to == null ? today : to;
        LocalDate start = switch (period == null ? ReportPeriod.MONTHLY : period) {
            case WEEKLY -> end.minusDays(6);
            case MONTHLY -> end.withDayOfMonth(1);
            case QUARTERLY -> end.minusMonths(2).withDayOfMonth(1);
            case YEARLY -> end.withDayOfYear(1);
            case CUSTOM -> from == null ? end.minusDays(29) : from;
        };
        if (start.isAfter(end)) {
            LocalDate tmp = start;
            start = end;
            end = tmp;
        }
        return new DateRange(start, end);
    }

    private MapSqlParameterSource params(DateRange range) {
        return new MapSqlParameterSource()
            .addValue("dateFrom", Date.valueOf(range.from()))
            .addValue("dateTo", Date.valueOf(range.to()))
            .addValue("start", Timestamp.from(range.from().atStartOfDay(ZONE).toInstant()))
            .addValue("end", Timestamp.from(range.to().plusDays(1).atStartOfDay(ZONE).toInstant()));
    }

    private void appendRow(StringBuilder csv, Object... cells) {
        for (int i = 0; i < cells.length; i++) {
            if (i > 0) csv.append(',');
            csv.append(escapeCsv(cells[i]));
        }
        csv.append('\n');
    }

    private void blank(StringBuilder csv) {
        csv.append('\n');
    }

    private String escapeCsv(Object value) {
        String text = value == null ? "" : value.toString();
        return "\"" + text.replace("\"", "\"\"") + "\"";
    }

    private String money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(0, RoundingMode.HALF_UP).toPlainString();
    }

    private BigDecimal percent(long numerator, long denominator) {
        if (denominator == 0) return BigDecimal.ZERO;
        return BigDecimal.valueOf(numerator).multiply(BigDecimal.valueOf(100))
            .divide(BigDecimal.valueOf(denominator), 1, RoundingMode.HALF_UP);
    }

    private BigDecimal percent(BigDecimal numerator, BigDecimal denominator) {
        if (denominator == null || denominator.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        return (numerator == null ? BigDecimal.ZERO : numerator).multiply(BigDecimal.valueOf(100))
            .divide(denominator, 1, RoundingMode.HALF_UP);
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }

    private long toLong(Object value) {
        if (value == null) return 0L;
        return ((Number) value).longValue();
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        return new BigDecimal(value.toString());
    }

    private record DateRange(LocalDate from, LocalDate to) {}
}
