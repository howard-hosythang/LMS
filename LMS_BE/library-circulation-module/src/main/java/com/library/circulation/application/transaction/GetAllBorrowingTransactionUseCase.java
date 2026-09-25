package com.library.circulation.application.transaction;

import com.library.circulation.dto.response.TransactionListResponse;

public interface GetAllBorrowingTransactionUseCase {
    com.library.shared.dto.PageResponse<TransactionListResponse> execute(
        int page,
        int size,
        String keyword,
        String status,
        String fineStatus,
        String dateFrom,
        String dateTo,
        String sortBy,
        String sortDir
    );
}
