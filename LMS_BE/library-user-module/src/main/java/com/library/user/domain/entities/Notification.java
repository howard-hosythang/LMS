package com.library.user.domain.entities;

import com.library.user.domain.enums.NotificationType;
import com.library.user.domain.valueobject.NotificationId;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(access = AccessLevel.PRIVATE)
public class Notification {

  private NotificationId id;
  private NotificationType type;
  private String title;
  private String message;
  private String link;
  private Long referenceId;
  private Instant createdAt;

  public static Notification create(NotificationType type, String title, String message,
      String link, Long referenceId) {
    return new Notification(NotificationId.generate(), type, title, message, link, referenceId,
        Instant.now());
  }

  public static Notification of(NotificationId id, NotificationType type, String title,
      String message, String link, Long referenceId, Instant createdAt) {
    return new Notification(id, type, title, message, link, referenceId, createdAt);
  }
}
