package com.library.user.infrastructure.kafka;

import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.UserRegisteredMessage;
import com.library.user.application.port.UserEventPublisher;
import com.library.user.domain.event.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserEventKafkaPublisher implements UserEventPublisher {

  private final KafkaTemplate<String, Object> kafkaTemplate;

  @Override
  public void publish(UserRegisteredEvent event) {
    UserRegisteredMessage message = new UserRegisteredMessage(
        event.getUserId().getValue(),
        event.getEmail(),
        event.getFullName()
    );
    kafkaTemplate.send(KafkaTopics.USER_REGISTERED, String.valueOf(message.userId()), message);
    log.info("Published UserRegisteredEvent for userId={}", message.userId());
  }
}
