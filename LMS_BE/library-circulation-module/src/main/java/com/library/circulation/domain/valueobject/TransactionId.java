package com.library.circulation.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

/**
 * Value Object representing a unique identifier for BorrowingTransaction.
 */
@Value
public class TransactionId {
    Long value;

    private TransactionId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("TransactionId cannot be null");
        }
        this.value = value;
    }

    public static TransactionId of(Long value) {
        return new TransactionId(value);
    }

    public static TransactionId generate() {
        return new TransactionId(TsIdGenerator.next());
    }
}
