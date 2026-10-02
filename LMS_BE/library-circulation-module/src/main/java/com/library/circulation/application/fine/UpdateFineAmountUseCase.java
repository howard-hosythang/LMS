package com.library.circulation.application.fine;

import com.library.circulation.dto.request.UpdateFineAmountRequest;
import java.math.BigDecimal;

public interface UpdateFineAmountUseCase {
    BigDecimal execute(Long fineId, Long librarianId, UpdateFineAmountRequest request);
}
