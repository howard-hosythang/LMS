package com.library.user.infrastructure.kafka;

import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.NotificationMessage;
import com.library.shared.util.TsIdGenerator;
import com.library.user.application.dto.response.NotificationResponse;
import com.library.user.domain.enums.NotificationType;
import com.library.user.infrastructure.persistence.entity.NotificationEntity;
import com.library.user.infrastructure.persistence.entity.UserNotificationEntity;
import com.library.user.infrastructure.persistence.repository.NotificationJpaRepository;
import com.library.user.infrastructure.persistence.repository.UserNotificationJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventConsumer {

    private final NotificationJpaRepository notificationJpaRepository;
    private final UserNotificationJpaRepository userNotificationJpaRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    @KafkaListener(topics = KafkaTopics.NOTIFICATION_SEND, groupId = "${spring.kafka.consumer.group-id}")
    public void handle(NotificationMessage message) {
        try {
            NotificationEntity notification = NotificationEntity.builder()
                .type(NotificationType.valueOf(message.type()))
                .title(message.title())
                .message(message.message())
                .link(message.link())
                .referenceId(message.referenceId())
                .build();
            notification.setId(TsIdGenerator.next());
            notificationJpaRepository.save(notification);

            UserNotificationEntity userNotification = UserNotificationEntity.builder()
                .userId(message.userId())
                .notificationId(notification.getId())
                .isRead(false)
                .build();
            userNotification.setId(TsIdGenerator.next());
            userNotificationJpaRepository.save(userNotification);
            Instant receivedAt = userNotification.getCreatedAt() != null
                ? userNotification.getCreatedAt()
                : Instant.now();

            NotificationResponse response = NotificationResponse.builder()
                .userNotificationId(userNotification.getId())
                .notificationId(notification.getId())
                .type(notification.getType().name())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .link(notification.getLink())
                .referenceId(notification.getReferenceId())
                .isRead(false)
                .receivedAt(receivedAt)
                .build();

            messagingTemplate.convertAndSendToUser(
                message.userId().toString(),
                "/queue/notifications",
                response
            );
            log.info("Notification sent to userId={}, type={}", message.userId(), message.type());
        } catch (Exception e) {
            log.error("Failed to process notification for userId={}: {}", message.userId(), e.getMessage());
            throw e;
        }
    }
}
