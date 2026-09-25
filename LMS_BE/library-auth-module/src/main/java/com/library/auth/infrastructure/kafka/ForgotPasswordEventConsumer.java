package com.library.auth.infrastructure.kafka;

import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.ForgotPasswordMessage;
import com.library.shared.service.EmailService;
import com.library.shared.templates.EmailTemplates;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ForgotPasswordEventConsumer {

  private final EmailService emailService;

  @KafkaListener(topics = KafkaTopics.USER_FORGOT_PASSWORD, groupId = "${spring.kafka.consumer.group-id}")
  public void handle(ForgotPasswordMessage message) {
    try {
      emailService.sendEmail(message.email(), message.fullName(), message.resetLink(),
          EmailTemplates.VERIFY_RESET_PASSWORD_TEMPLATE);
      log.info("Sent reset password email to {}", message.email());
    } catch (AppException e) {
      log.error("Failed to send reset password email to {}: {}", message.email(), e.getMessage());
      throw e;
    } catch (Exception e) {
      log.error("Failed to send reset password email to {}: {}", message.email(), e.getMessage());
      throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }
  }
}
