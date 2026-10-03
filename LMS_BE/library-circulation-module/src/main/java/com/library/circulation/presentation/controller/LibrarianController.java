package com.library.circulation.presentation.controller;

import com.library.circulation.application.dashboard.DashboardChartsUseCase;
import com.library.circulation.application.dashboard.DashboardReportUseCase;
import com.library.circulation.application.dashboard.DashboardRiskyUsersUseCase;
import com.library.circulation.application.dashboard.DashboardSummaryUseCase;
import com.library.circulation.application.dashboard.ReaderProfileUseCase;
import com.library.circulation.dto.enums.DashboardPeriod;
import com.library.circulation.dto.enums.ReportPeriod;
import com.library.circulation.dto.response.DashboardChartsResponse;
import com.library.circulation.dto.response.DashboardReportResponse;
import com.library.circulation.dto.response.DashboardSummaryResponse;
import com.library.circulation.dto.response.ReaderActivityTimelineResponse;
import com.library.circulation.dto.response.ReaderProfileResponse;
import com.library.circulation.dto.response.RiskyUserResponse;
import com.library.shared.constant.RoleConstants;
import com.library.shared.dto.ApiResponseApp;
import com.library.shared.dto.PageResponse;
import com.library.shared.util.RequiresRole;
import io.swagger.v3.oas.annotations.Operation;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/librarians")
@RequiredArgsConstructor
public class LibrarianController {

  private final DashboardSummaryUseCase dashboardSummaryUseCase;
  private final DashboardChartsUseCase dashboardChartsUseCase;
  private final DashboardRiskyUsersUseCase dashboardRiskyUsersUseCase;
  private final DashboardReportUseCase dashboardReportUseCase;
  private final ReaderProfileUseCase readerProfileUseCase;
  private final com.library.shared.util.SecurityEvaluator security;

  @GetMapping(value = "/dashboard/report/export-excel", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ResponseEntity<byte[]> exportExcel(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    byte[] bytes = dashboardReportUseCase.exportExcel(from, to, security.getCurrentUserId());
    return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,
        "attachment; filename=\"Bao_Cao_Van_Hanh_LMS_" + from + "_" + to + ".xlsx\"")
        .header(HttpHeaders.CACHE_CONTROL, "no-store")
        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
        .body(bytes);
  }

  @GetMapping("/dashboard/report/print")
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<com.library.circulation.dto.response.OperationalReportPrintResponse> printReport(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    return ApiResponseApp.success(dashboardReportUseCase.printReport(from, to, security.getCurrentUserId()));
  }

  @GetMapping("/dashboard/summary")
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "Get summary data for the dashboard")
  public ApiResponseApp<DashboardSummaryResponse> getDashboardSummary() {
    return ApiResponseApp.success(dashboardSummaryUseCase.execute());
  }

  @GetMapping("/dashboard/charts")
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "Get charts for the dashboard")
  public ApiResponseApp<DashboardChartsResponse> getCharts(
      @RequestParam(name = "period") DashboardPeriod period) {
    return ApiResponseApp.success(dashboardChartsUseCase.execute(period));
  }

  @GetMapping("/dashboard/risky-users")
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "Get a list of risky users")
  public ApiResponseApp<PageResponse<RiskyUserResponse>> getRiskyUsers(
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "5") int size,
      @RequestParam(name = "sortBy", defaultValue = "creditScore") String sortBy,
      @RequestParam(name = "sortDir", defaultValue = "ASC") String sortDir) {
    return ApiResponseApp.success(dashboardRiskyUsersUseCase.execute(page, size, sortBy, sortDir));
  }

  @GetMapping("/readers/profile")
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "Get reader identity and credit health for Reader 360 drawer")
  public ApiResponseApp<ReaderProfileResponse> getReaderProfile(
      @RequestParam(name = "userId", required = false) Long userId,
      @RequestParam(name = "studentId", required = false) String studentId) {
    return ApiResponseApp.success(readerProfileUseCase.getProfile(userId, studentId));
  }

  @GetMapping("/readers/timeline")
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "Get recent reader activity timeline for Reader 360 drawer")
  public ApiResponseApp<List<ReaderActivityTimelineResponse>> getReaderTimeline(
      @RequestParam(name = "userId", required = false) Long userId,
      @RequestParam(name = "studentId", required = false) String studentId,
      @RequestParam(name = "limit", defaultValue = "10") int limit) {
    return ApiResponseApp.success(readerProfileUseCase.getTimeline(userId, studentId, limit));
  }

  @GetMapping("/dashboard/report")
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "Get operational and financial report for librarians")
  public ApiResponseApp<DashboardReportResponse> getReport(
      @RequestParam(name = "period", defaultValue = "MONTHLY") ReportPeriod period,
      @RequestParam(name = "dateFrom", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
      @RequestParam(name = "dateTo", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
    return ApiResponseApp.success(dashboardReportUseCase.execute(period, dateFrom, dateTo));
  }

  @GetMapping(value = "/dashboard/report/export", produces = "text/csv")
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "Export readable librarian report as CSV")
  public ResponseEntity<byte[]> exportReport(
      @RequestParam(name = "period", defaultValue = "MONTHLY") ReportPeriod period,
      @RequestParam(name = "dateFrom", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
      @RequestParam(name = "dateTo", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
    byte[] bytes = dashboardReportUseCase.exportCsv(period, dateFrom, dateTo);
    String filename = "bao-cao-dieu-hanh-" + LocalDate.now() + ".csv";
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
        .contentType(new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8))
        .body(bytes);
  }

}
