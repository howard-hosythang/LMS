package com.library.circulation.application.transaction;

import com.library.circulation.dto.request.RestoreLostBookCommand;
import com.library.circulation.dto.response.RestoreLostBookResponse;

public interface RestoreLostBookUseCase {
    RestoreLostBookResponse execute(Long transactionId, Long librarianId, RestoreLostBookCommand command);
}
