package com.library.user.presentation.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.library.shared.dto.PageResponse;
import com.library.shared.util.SecurityEvaluator;
import com.library.user.application.dto.response.NotificationResponse;
import com.library.user.application.usecase.notification.GetNotificationsUseCase;
import com.library.user.application.usecase.notification.MarkAllNotificationsReadUseCase;
import com.library.user.application.usecase.notification.MarkNotificationReadUseCase;
import com.library.user.infrastructure.persistence.repository.UserNotificationJpaRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationController — MockMvc")
class NotificationControllerTest {

    private static final Long USER_ID = 4L;

    @Mock GetNotificationsUseCase getNotificationsUseCase;
    @Mock MarkNotificationReadUseCase markNotificationReadUseCase;
    @Mock MarkAllNotificationsReadUseCase markAllNotificationsReadUseCase;
    @Mock UserNotificationJpaRepository userNotificationJpaRepository;
    @Mock SecurityEvaluator security;

    @InjectMocks NotificationController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /users/notifications returns paginated current-user notifications")
    void getNotifications_shouldReturnPage() throws Exception {
        NotificationResponse notification = NotificationResponse.builder()
            .userNotificationId(10L)
            .notificationId(20L)
            .type("BOOK_RESERVED")
            .title("Đặt trước sách thành công")
            .message("Bạn đang ở vị trí 1 trong hàng chờ.")
            .referenceId(99L)
            .isRead(false)
            .build();
        PageResponse<NotificationResponse> page = PageResponse.<NotificationResponse>builder()
            .content(List.of(notification))
            .currentPage(0)
            .pageSize(20)
            .totalElements(1)
            .totalPages(1)
            .isFirst(true)
            .isLast(true)
            .build();

        when(security.getCurrentUserId()).thenReturn(USER_ID);
        when(getNotificationsUseCase.execute(USER_ID, 0, 20)).thenReturn(page);

        mockMvc.perform(get("/api/v1/users/notifications")
                .param("page", "0")
                .param("size", "20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content[0].type").value("BOOK_RESERVED"))
            .andExpect(jsonPath("$.data.content[0].title").value("Đặt trước sách thành công"))
            .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /users/notifications/unread-count returns unread count")
    void getUnreadCount_shouldReturnRepositoryCount() throws Exception {
        when(security.getCurrentUserId()).thenReturn(USER_ID);
        when(userNotificationJpaRepository.countByUserIdAndIsReadFalse(USER_ID)).thenReturn(3L);

        mockMvc.perform(get("/api/v1/users/notifications/unread-count"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").value(3));
    }

    @Test
    @DisplayName("PUT /users/notifications/{id}/read marks one current-user notification")
    void markAsRead_shouldCallUseCaseWithCurrentUser() throws Exception {
        when(security.getCurrentUserId()).thenReturn(USER_ID);

        mockMvc.perform(put("/api/v1/users/notifications/{id}/read", 20L))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Notification marked as read"));

        verify(markNotificationReadUseCase).execute(20L, USER_ID);
    }

    @Test
    @DisplayName("PUT /users/notifications/read-all marks all current-user notifications")
    void markAllAsRead_shouldCallUseCaseWithCurrentUser() throws Exception {
        when(security.getCurrentUserId()).thenReturn(USER_ID);

        mockMvc.perform(put("/api/v1/users/notifications/read-all"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("All notifications marked as read"));

        verify(markAllNotificationsReadUseCase).execute(USER_ID);
    }
}
