package com.library.auth.application.impl;

import com.library.auth.application.ForgotPasswordUseCase;
import com.library.auth.domain.entity.PasswordResetToken;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.kafka.event.ForgotPasswordMessage;
import com.library.user.domain.entities.User;
import com.library.user.domain.repository.UserRepository;
import com.library.user.domain.valueobject.Email;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ForgotPasswordUseCaseImpl implements ForgotPasswordUseCase {

  private final UserRepository userRepository;
  private final com.library.auth.domain.repository.PasswordResetTokenRepository passwordResetTokenRepository;
  private final com.library.auth.infrastructure.kafka.ForgotPasswordKafkaPublisher kafkaPublisher;

  @Value("${base.frontend-url}")
  private String frontendUrl;

  @Override
  @Transactional
  public void execute(com.library.auth.dto.request.ForgotPasswordRequest request) {
    User user = userRepository.findByEmail(Email.of(request.email()))
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    passwordResetTokenRepository.deleteByUserId(user.getId().getValue());

    String token = UUID.randomUUID().toString();
    Instant expiresAt = Instant.now().plusSeconds(15 * 60);
    passwordResetTokenRepository.save(new PasswordResetToken(token, user.getId().getValue(), expiresAt));

    String resetLink = frontendUrl + "/#/publicpage/reset-password?token=" + token;

    kafkaPublisher.publish(new ForgotPasswordMessage(
        user.getEmail().getValue(),
        user.getProfile().getFullName(),
        resetLink
    ));
  }
}
