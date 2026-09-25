package com.library.circulation.application.transaction;

import com.library.circulation.dto.response.ActiveTransactionResponse;

public interface LookupActiveTransactionUseCase {
    ActiveTransactionResponse execute(String barcode);
}
