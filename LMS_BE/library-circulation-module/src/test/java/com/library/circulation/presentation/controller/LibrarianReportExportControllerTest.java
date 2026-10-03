package com.library.circulation.presentation.controller;

import com.library.circulation.application.dashboard.*;
import com.library.shared.util.RequiresRole;
import com.library.shared.util.SecurityEvaluator;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class LibrarianReportExportControllerTest {
    @Test void excelHasCorrectFilenameMimeAndAuthenticatedActor() throws Exception {
        var reports = mock(DashboardReportUseCase.class);
        var security = mock(SecurityEvaluator.class);
        when(security.getCurrentUserId()).thenReturn(7L);
        var from=LocalDate.of(2026,10,1); var to=LocalDate.of(2026,10,3);
        when(reports.exportExcel(from,to,7L)).thenReturn(new byte[]{1,2});
        var controller = new LibrarianController(mock(DashboardSummaryUseCase.class), mock(DashboardChartsUseCase.class),
            mock(DashboardRiskyUsersUseCase.class), reports, mock(ReaderProfileUseCase.class), security);
        var response=controller.exportExcel(from,to);
        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION)).contains("Bao_Cao_Van_Hanh_LMS_2026-10-01_2026-10-03.xlsx");
        assertThat(response.getHeaders().getContentType().toString()).contains("spreadsheetml.sheet");
        assertThat(response.getHeaders().getCacheControl()).isEqualTo("no-store");
        assertThat(response.getBody()).containsExactly((byte)1,(byte)2);
        assertThat(LibrarianController.class.getMethod("exportExcel",LocalDate.class,LocalDate.class).getAnnotation(RequiresRole.class)).isNotNull();
        assertThat(LibrarianController.class.getMethod("printReport",LocalDate.class,LocalDate.class).getAnnotation(RequiresRole.class)).isNotNull();
    }
}
