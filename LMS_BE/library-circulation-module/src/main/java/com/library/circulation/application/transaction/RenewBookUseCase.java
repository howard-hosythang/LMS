package com.library.circulation.application.transaction;

import com.library.circulation.dto.response.BorrowTransactionResponse;

public interface RenewBookUseCase {
  BorrowTransactionResponse execute(Long transactionId, Long actorUserId, boolean isLibrarian);
}
