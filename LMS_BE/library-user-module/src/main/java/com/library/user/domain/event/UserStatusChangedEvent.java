package com.library.user.domain.event;

import com.library.user.domain.entities.UserStatus;
import com.library.user.domain.valueobject.UserId;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Domain event: User status changed
 */
@Getter
@AllArgsConstructor
public class UserStatusChangedEvent {
    private final UserId userId;
    private final UserStatus oldStatus;
    private final UserStatus newStatus;
    private final LocalDateTime occurredOn;

    public UserStatusChangedEvent(UserId userId, UserStatus oldStatus, UserStatus newStatus) {
        this.userId = userId;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.occurredOn = LocalDateTime.now();
    }

}
