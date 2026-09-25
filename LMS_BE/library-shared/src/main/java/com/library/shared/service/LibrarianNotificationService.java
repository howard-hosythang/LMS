package com.library.shared.service;

import com.library.shared.constant.RoleConstants;
import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.NotificationMessage;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class LibrarianNotificationService {

  private static final String ACTIVE_LIBRARIANS_SQL = """
      SELECT DISTINCT u.id
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE r.role_name = :roleName
        AND u.status = 'ACTIVE'
      """;

  private final NamedParameterJdbcTemplate jdbcTemplate;
  private final KafkaTemplate<String, Object> kafkaTemplate;

  public void notifyAll(String type, String title, String message, String link, Long referenceId) {
    List<Long> librarianIds = jdbcTemplate.queryForList(
        ACTIVE_LIBRARIANS_SQL,
        new MapSqlParameterSource("roleName", RoleConstants.LIBRARIAN),
        Long.class
    );
    for (Long librarianId : librarianIds) {
      notifyOne(librarianId, type, title, message, link, referenceId);
    }
    log.info("Queued librarian notification: type={}, recipients={}", type, librarianIds.size());
  }

  public void notifyOne(Long librarianId, String type, String title, String message, String link, Long referenceId) {
    if (librarianId == null) {
      return;
    }
    kafkaTemplate.send(KafkaTopics.NOTIFICATION_SEND, new NotificationMessage(
        librarianId,
        type,
        title,
        message,
        link,
        referenceId
    ));
  }
}
