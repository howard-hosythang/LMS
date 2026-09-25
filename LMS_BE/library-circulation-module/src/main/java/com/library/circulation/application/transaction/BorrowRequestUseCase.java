package com.library.circulation.application.transaction;

import com.library.circulation.dto.request.BorrowRequestCommand;
import com.library.circulation.dto.response.BorrowTransactionResponse;

public interface BorrowRequestUseCase {
    BorrowTransactionResponse execute(Long userId, BorrowRequestCommand command);
}
