package com.library.user.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

@Value
public class UserId {
    Long value;

    private UserId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        this.value = value;
    }

    public static UserId of(Long value) {
        return new UserId(value);
    }

    public static UserId generate() {
        return new UserId(TsIdGenerator.next());
    }
}
