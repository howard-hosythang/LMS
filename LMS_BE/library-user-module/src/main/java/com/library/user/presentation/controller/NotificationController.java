package com.library.user.presentation.controller;

import com.library.shared.dto.ApiResponseApp;
import com.library.shared.dto.PageResponse;
import com.library.shared.util.RequiresAuthentication;
import com.library.shared.util.SecurityEvaluator;
import com.library.user.application.dto.response.NotificationResponse;
import com.library.user.application.usecase.notification.GetNotificationsUseCase;
import com.library.user.application.usecase.notification.MarkAllNotificationsReadUseCase;
import com.library.user.application.usecase.notification.MarkNotificationReadUseCase;
import com.library.user.infrastructure.persistence.repository.UserNotificationJpaRepository;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final GetNotificationsUseCase getNotificationsUseCase;
    private final MarkNotificationReadUseCase markNotificationReadUseCase;
    private final MarkAllNotificationsReadUseCase markAllNotificationsReadUseCase;
    private final UserNotificationJpaRepository userNotificationJpaRepository;
    private final SecurityEvaluator security;

    @GetMapping
    @RequiresAuthentication
    @Operation(summary = "Get paginated notifications for current user")
    public ApiResponseApp<PageResponse<NotificationResponse>> getNotifications(
        @RequestParam(name = "page", defaultValue = "0") int page,
        @RequestParam(name = "size", defaultValue = "20") int size) {
        Long userId = security.getCurrentUserId();
        return ApiResponseApp.success(getNotificationsUseCase.execute(userId, page, size));
    }

    @GetMapping("/unread-count")
    @RequiresAuthentication
    @Operation(summary = "Get unread notification count for current user")
    public ApiResponseApp<Long> getUnreadCount() {
        Long userId = security.getCurrentUserId();
        return ApiResponseApp.success(userNotificationJpaRepository.countByUserIdAndIsReadFalse(userId));
    }

    @PutMapping("/{id}/read")
    @RequiresAuthentication
    @Operation(summary = "Mark a notification as read")
    public ApiResponseApp<Void> markAsRead(@PathVariable("id") Long id) {
        Long userId = security.getCurrentUserId();
        markNotificationReadUseCase.execute(id, userId);
        return ApiResponseApp.success("Notification marked as read");
    }

    @PutMapping("/read-all")
    @RequiresAuthentication
    @Operation(summary = "Mark all notifications as read")
    public ApiResponseApp<Void> markAllAsRead() {
        Long userId = security.getCurrentUserId();
        markAllNotificationsReadUseCase.execute(userId);
        return ApiResponseApp.success("All notifications marked as read");
    }
}
