package com.library.circulation.application.fine;

import com.library.circulation.dto.response.FineResponse;

public interface GetMyFinesUseCase {
    com.library.shared.dto.PageResponse<FineResponse> execute(Long userId, String status, int page, int size);
}
