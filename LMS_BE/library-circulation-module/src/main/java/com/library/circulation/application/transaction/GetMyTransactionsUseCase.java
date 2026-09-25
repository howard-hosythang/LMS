package com.library.circulation.application.transaction;

import com.library.circulation.dto.response.UserTransactionResponse;

public interface GetMyTransactionsUseCase {
    com.library.shared.dto.PageResponse<UserTransactionResponse> execute(Long userId, int page, int size);
}
