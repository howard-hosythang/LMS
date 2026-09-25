package com.library.user.application.usecase.notification;

public interface MarkNotificationReadUseCase {
    void execute(Long userNotificationId, Long userId);
}
