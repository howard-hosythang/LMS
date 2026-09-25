package com.library.user.application.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationResponse {
    @JsonSerialize(using = ToStringSerializer.class)
    private Long userNotificationId;
    @JsonSerialize(using = ToStringSerializer.class)
    private Long notificationId;
    private String type;
    private String title;
    private String message;
    private String link;
    @JsonSerialize(using = ToStringSerializer.class)
    private Long referenceId;
    private boolean isRead;
    private Instant receivedAt;
    private Instant readAt;
}
