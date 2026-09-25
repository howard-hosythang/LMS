package com.library.circulation.application.transaction;

import com.library.circulation.dto.request.ReturnCommand;
import com.library.circulation.dto.response.ReturnResponse;

public interface ReturnBookUseCase {
    ReturnResponse execute(Long librarianId, ReturnCommand command);
}
