package com.library.user.infrastructure.persistence.repository;

import com.library.user.infrastructure.persistence.entity.UserNotificationEntity;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserNotificationJpaRepository extends JpaRepository<UserNotificationEntity, Long> {

  long countByUserIdAndIsReadFalse(Long userId);

  @Modifying
  @Query("UPDATE UserNotificationEntity un SET un.isRead = true, un.readAt = :readAt WHERE un.id = :id AND un.userId = :userId AND un.isRead = false")
  int markAsRead(@Param("id") Long id, @Param("userId") Long userId,
      @Param("readAt") Instant readAt);

  @Modifying
  @Query("UPDATE UserNotificationEntity un SET un.isRead = true, un.readAt = :readAt WHERE un.userId = :userId AND un.isRead = false")
  void markAllAsRead(@Param("userId") Long userId, @Param("readAt") Instant readAt);
}
