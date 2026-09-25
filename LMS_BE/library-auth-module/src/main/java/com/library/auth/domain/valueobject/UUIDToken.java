package com.library.auth.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

@Value
public class UUIDToken {
    String value;

    private UUIDToken(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("UUIDToken cannot be null or empty");
        }
        this.value = value;
    }

    public static UUIDToken of(String value) {
        return new UUIDToken(value);
    }

    public static UUIDToken generate() {
        return new UUIDToken(TsIdGenerator.next().toString());
    }


}
