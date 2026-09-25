package com.library.circulation.application.transaction;

import com.library.circulation.dto.request.DirectBorrowCommand;
import com.library.circulation.dto.response.BorrowTransactionResponse;

public interface DirectBorrowUseCase {
    BorrowTransactionResponse execute(Long librarianId, DirectBorrowCommand command);
}
