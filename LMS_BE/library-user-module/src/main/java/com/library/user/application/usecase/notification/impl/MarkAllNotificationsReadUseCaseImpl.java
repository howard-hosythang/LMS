package com.library.user.application.usecase.notification.impl;

import com.library.user.application.usecase.notification.MarkAllNotificationsReadUseCase;
import com.library.user.infrastructure.persistence.repository.UserNotificationJpaRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MarkAllNotificationsReadUseCaseImpl implements MarkAllNotificationsReadUseCase {

    private final UserNotificationJpaRepository userNotificationJpaRepository;

    @Override
    @Transactional
    public void execute(Long userId) {
        userNotificationJpaRepository.markAllAsRead(userId, Instant.now());
    }
}
