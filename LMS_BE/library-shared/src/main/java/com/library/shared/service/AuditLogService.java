package com.library.shared.service;

import java.util.Map;

public interface AuditLogService {
    void log(Long actorUserId, String actorRole, String action, String entityType, Object entityId,
        String summary, Map<String, ?> details);
}
