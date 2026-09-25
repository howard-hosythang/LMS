package com.library.circulation.application.transaction;

import com.library.circulation.dto.response.LostBookRecoveryPreviewResponse;

public interface LookupLostBookRecoveryPreviewUseCase {
    LostBookRecoveryPreviewResponse execute(Long transactionId);
}
