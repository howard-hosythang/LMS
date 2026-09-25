package com.library.circulation.application.dashboard;

import com.library.circulation.dto.response.RiskyUserResponse;

public interface DashboardRiskyUsersUseCase {
    com.library.shared.dto.PageResponse<RiskyUserResponse> execute(int page, int size, String sortBy, String sortDir);
}
