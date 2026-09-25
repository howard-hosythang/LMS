package com.library.user.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

@Value
public class UserInteractionId {
    Long value;

    private UserInteractionId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("UserInteraction ID cannot be null");
        }
        this.value = value;
    }

    public static UserInteractionId of(Long value) {
        return new UserInteractionId(value);
    }

    public static UserInteractionId generate() {
        return new UserInteractionId(TsIdGenerator.next());
    }
}
