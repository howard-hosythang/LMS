package com.library.user.domain.repository;

import com.library.user.domain.entities.Notification;
import com.library.user.domain.valueobject.NotificationId;
import com.library.user.domain.valueobject.UserId;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository {
    Optional<Notification> findById(NotificationId id);
    List<Notification> findByUserId(UserId userId);
    Notification save(Notification notification);
    void deleteById(NotificationId id);
}
