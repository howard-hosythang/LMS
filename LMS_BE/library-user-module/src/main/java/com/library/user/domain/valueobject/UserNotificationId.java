package com.library.user.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

@Value
public class UserNotificationId {
    Long value;

    private UserNotificationId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("UserNotificationId ID cannot be null");
        }
        this.value = value;
    }

    public static UserNotificationId of(Long value) {
        return new UserNotificationId(value);
    }

    public static UserNotificationId generate() {
        return new UserNotificationId(TsIdGenerator.next());
    }
}
