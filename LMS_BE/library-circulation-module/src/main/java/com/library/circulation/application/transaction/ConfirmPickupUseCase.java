package com.library.circulation.application.transaction;

import com.library.circulation.dto.response.BorrowTransactionResponse;

public interface ConfirmPickupUseCase {
    BorrowTransactionResponse execute(Long transactionId, Long librarianId);
}
