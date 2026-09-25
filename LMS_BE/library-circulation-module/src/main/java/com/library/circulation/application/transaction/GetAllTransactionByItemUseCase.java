package com.library.circulation.application.transaction;

import com.library.circulation.dto.response.TransactionListResponse;

public interface GetAllTransactionByItemUseCase {
    com.library.shared.dto.PageResponse<TransactionListResponse> execute(Long itemId, int page, int size);
}
