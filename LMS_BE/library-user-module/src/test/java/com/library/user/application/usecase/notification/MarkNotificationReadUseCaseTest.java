package com.library.user.application.usecase.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.user.application.usecase.notification.impl.MarkAllNotificationsReadUseCaseImpl;
import com.library.user.application.usecase.notification.impl.MarkNotificationReadUseCaseImpl;
import com.library.user.infrastructure.persistence.repository.UserNotificationJpaRepository;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("Notification Read UseCases — Unit Tests")
class MarkNotificationReadUseCaseTest {

  @Mock private UserNotificationJpaRepository userNotificationJpaRepository;

  @InjectMocks private MarkNotificationReadUseCaseImpl markOneUseCase;
  @InjectMocks private MarkAllNotificationsReadUseCaseImpl markAllUseCase;

  @Test
  @DisplayName("Đánh dấu một notification là đã đọc thành công")
  void markAsReadSuccess() {
    when(userNotificationJpaRepository.markAsRead(eq(10L), eq(1001L), any(Instant.class)))
        .thenReturn(1);

    markOneUseCase.execute(10L, 1001L);

    verify(userNotificationJpaRepository).markAsRead(eq(10L), eq(1001L), any(Instant.class));
  }

  @Test
  @DisplayName("Ném NOTIFICATION_NOT_FOUND khi notification không thuộc user hoặc đã đọc")
  void throwNotificationNotFound_whenNoRowUpdated() {
    when(userNotificationJpaRepository.markAsRead(eq(10L), eq(1001L), any(Instant.class)))
        .thenReturn(0);

    assertThatThrownBy(() -> markOneUseCase.execute(10L, 1001L))
        .isInstanceOf(AppException.class)
        .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
            .isEqualTo(ErrorCode.NOTIFICATION_NOT_FOUND));
  }

  @Test
  @DisplayName("Đánh dấu tất cả notification chưa đọc của user")
  void markAllAsReadSuccess() {
    markAllUseCase.execute(1001L);

    verify(userNotificationJpaRepository).markAllAsRead(eq(1001L), any(Instant.class));
  }
}
