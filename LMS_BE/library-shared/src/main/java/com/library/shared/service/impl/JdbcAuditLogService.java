package com.library.shared.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.shared.service.AuditLogService;
import com.library.shared.util.TsIdGenerator;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class JdbcAuditLogService implements AuditLogService {

    private static final String INSERT_SQL = """
        INSERT INTO audit_logs (
            id, created_at, actor_user_id, actor_role, action,
            entity_type, entity_id, summary, details
        )
        VALUES (
            :id, NOW(), :actorUserId, :actorRole, :action,
            :entityType, :entityId, :summary, CAST(:details AS jsonb)
        )
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public void log(Long actorUserId, String actorRole, String action, String entityType, Object entityId,
        String summary, Map<String, ?> details) {
        try {
            jdbcTemplate.update(
                INSERT_SQL,
                new MapSqlParameterSource()
                    .addValue("id", TsIdGenerator.next())
                    .addValue("actorUserId", actorUserId)
                    .addValue("actorRole", actorRole)
                    .addValue("action", action)
                    .addValue("entityType", entityType)
                    .addValue("entityId", entityId != null ? String.valueOf(entityId) : null)
                    .addValue("summary", summary)
                    .addValue("details", details == null ? null : objectMapper.writeValueAsString(details))
            );
        } catch (Exception e) {
            log.warn("Failed to write audit log action={}, entityType={}, entityId={}",
                action, entityType, entityId, e);
        }
    }
}
