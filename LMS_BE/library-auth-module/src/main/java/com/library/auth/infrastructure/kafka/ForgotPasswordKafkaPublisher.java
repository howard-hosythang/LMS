package com.library.auth.infrastructure.kafka;

import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.ForgotPasswordMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ForgotPasswordKafkaPublisher {

  private final KafkaTemplate<String, Object> kafkaTemplate;

  public void publish(ForgotPasswordMessage message) {
    kafkaTemplate.send(KafkaTopics.USER_FORGOT_PASSWORD, message.email(), message);
    log.info("Published ForgotPasswordMessage for email={}", message.email());
  }
}
