package com.library.circulation.application.transaction;

import com.library.circulation.dto.response.LookupTransactionResponse;

public interface LookupForPickupUseCase {
    LookupTransactionResponse execute(Long transactionId, String studentId, String barcode);
}
