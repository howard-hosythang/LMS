package com.library.user.application.usecase.notification.impl;

import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.user.application.usecase.notification.MarkNotificationReadUseCase;
import com.library.user.infrastructure.persistence.repository.UserNotificationJpaRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MarkNotificationReadUseCaseImpl implements MarkNotificationReadUseCase {

    private final UserNotificationJpaRepository userNotificationJpaRepository;

    @Override
    @Transactional
    public void execute(Long userNotificationId, Long userId) {
        int updated = userNotificationJpaRepository.markAsRead(userNotificationId, userId, Instant.now());
        if (updated == 0) {
            throw new AppException(ErrorCode.NOTIFICATION_NOT_FOUND);
        }
    }
}
