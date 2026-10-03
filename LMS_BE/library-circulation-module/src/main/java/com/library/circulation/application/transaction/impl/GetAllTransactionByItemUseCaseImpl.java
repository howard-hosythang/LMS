package com.library.circulation.application.transaction.impl;

import com.library.circulation.application.transaction.GetAllBorrowingTransactionUseCase;
import com.library.circulation.application.transaction.GetAllTransactionByItemUseCase;
import com.library.circulation.dto.response.TransactionListResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetAllTransactionByItemUseCaseImpl implements GetAllTransactionByItemUseCase {

    private final GetAllBorrowingTransactionUseCase transactions;

    @Override
    public com.library.shared.dto.PageResponse<TransactionListResponse> execute(Long itemId, int page, int size) {
        return transactions.search(page, size, null, null, null, null, null,
            "createdAt", "DESC", "BORROWED", null, itemId, null, null);
    }
}
