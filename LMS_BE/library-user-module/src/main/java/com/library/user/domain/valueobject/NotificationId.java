package com.library.user.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

@Value
public class NotificationId {
    Long value;

    private NotificationId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("Notification ID cannot be null");
        }
        this.value = value;
    }

    public static NotificationId of(Long value) {
        return new NotificationId(value);
    }

    public static NotificationId generate() {
        return new NotificationId(TsIdGenerator.next());
    }
}
