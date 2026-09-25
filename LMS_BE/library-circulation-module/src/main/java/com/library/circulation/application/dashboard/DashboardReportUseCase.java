package com.library.circulation.application.dashboard;

import com.library.circulation.dto.enums.ReportPeriod;
import com.library.circulation.dto.response.DashboardReportResponse;
import java.time.LocalDate;

public interface DashboardReportUseCase {
    DashboardReportResponse execute(ReportPeriod period, LocalDate dateFrom, LocalDate dateTo);
    byte[] exportCsv(ReportPeriod period, LocalDate dateFrom, LocalDate dateTo);
}
