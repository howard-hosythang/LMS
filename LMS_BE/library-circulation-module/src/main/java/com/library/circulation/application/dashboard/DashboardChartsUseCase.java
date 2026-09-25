package com.library.circulation.application.dashboard;

import com.library.circulation.dto.enums.DashboardPeriod;
import com.library.circulation.dto.response.DashboardChartsResponse;

public interface DashboardChartsUseCase {
    DashboardChartsResponse execute(DashboardPeriod period);
}
