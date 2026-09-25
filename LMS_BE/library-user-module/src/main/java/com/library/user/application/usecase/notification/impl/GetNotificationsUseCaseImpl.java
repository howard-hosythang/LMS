package com.library.user.application.usecase.notification.impl;

import com.library.shared.dto.PageResponse;
import com.library.user.application.dto.response.NotificationResponse;
import com.library.user.application.usecase.notification.GetNotificationsUseCase;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetNotificationsUseCaseImpl implements GetNotificationsUseCase {

    private static final String LIST_SQL = """
        SELECT
            un.id           AS user_notification_id,
            un.is_read,
            un.created_at   AS received_at,
            un.read_at,
            n.id            AS notification_id,
            n.type,
            n.title,
            n.message,
            n.link,
            n.reference_id
        FROM user_notifications un
        JOIN notifications n ON n.id = un.notification_id
        WHERE un.user_id = :userId
        ORDER BY un.created_at DESC
        LIMIT :size OFFSET :offset
        """;

    private static final String COUNT_SQL = """
        SELECT COUNT(*) FROM user_notifications WHERE user_id = :userId
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> execute(Long userId, int page, int size) {
        MapSqlParameterSource params = new MapSqlParameterSource()
            .addValue("userId", userId)
            .addValue("size", size)
            .addValue("offset", (long) page * size);

        List<NotificationResponse> content = jdbcTemplate.query(LIST_SQL, params, (rs, i) ->
            NotificationResponse.builder()
                .userNotificationId(rs.getLong("user_notification_id"))
                .notificationId(rs.getLong("notification_id"))
                .type(rs.getString("type"))
                .title(rs.getString("title"))
                .message(rs.getString("message"))
                .link(rs.getString("link"))
                .referenceId(rs.getObject("reference_id", Long.class))
                .isRead(rs.getBoolean("is_read"))
                .receivedAt(rs.getTimestamp("received_at") != null
                    ? rs.getTimestamp("received_at").toInstant() : null)
                .readAt(rs.getTimestamp("read_at") != null
                    ? rs.getTimestamp("read_at").toInstant() : null)
                .build()
        );

        Long totalElements = jdbcTemplate.queryForObject(COUNT_SQL,
            Map.of("userId", userId), Long.class);
        if (totalElements == null) totalElements = 0L;
        int totalPages = (int) Math.ceil((double) totalElements / size);

        return PageResponse.<NotificationResponse>builder()
            .content(content)
            .currentPage(page)
            .pageSize(size)
            .totalElements(totalElements)
            .totalPages(totalPages)
            .isFirst(page == 0)
            .isLast(page >= totalPages - 1)
            .build();
    }
}
