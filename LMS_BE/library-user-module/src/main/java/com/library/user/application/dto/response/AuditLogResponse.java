package com.library.user.application.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.time.Instant;
import lombok.Builder;

@Builder
public record AuditLogResponse(
    @JsonSerialize(using = ToStringSerializer.class)
    Long id,
    Instant createdAt,
    @JsonSerialize(using = ToStringSerializer.class)
    Long actorUserId,
    String actorName,
    String actorRole,
    String action,
    String entityType,
    String entityId,
    String summary,
    JsonNode details
) {
}
