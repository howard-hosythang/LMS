package com.library.user.application.usecase.notification;

import com.library.shared.dto.PageResponse;
import com.library.user.application.dto.response.NotificationResponse;

public interface GetNotificationsUseCase {
    PageResponse<NotificationResponse> execute(Long userId, int page, int size);
}
