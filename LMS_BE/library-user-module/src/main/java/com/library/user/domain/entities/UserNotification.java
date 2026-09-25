package com.library.user.domain.entities;

import com.library.user.domain.valueobject.NotificationId;
import com.library.user.domain.valueobject.UserId;
import com.library.user.domain.valueobject.UserNotificationId;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class UserNotification {
    private UserNotificationId id;
    private UserId userId;
    private NotificationId notificationId;
    private boolean isRead;
    private Instant receivedAt;

    public static UserNotification create(UserId userId, NotificationId notificationId) {
        return new UserNotification(UserNotificationId.generate(), userId, notificationId, false, Instant.now());
    }

    public static UserNotification of(UserNotificationId id, UserId userId, NotificationId notificationId,
                                      boolean isRead, Instant receivedAt) {
        return new UserNotification(id, userId, notificationId, isRead, receivedAt);
    }
}
