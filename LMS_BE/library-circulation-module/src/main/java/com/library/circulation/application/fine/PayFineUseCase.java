package com.library.circulation.application.fine;

import com.library.circulation.dto.response.FineResponse;

public interface PayFineUseCase {
    FineResponse execute(Long fineId, Long librarianId);
}
