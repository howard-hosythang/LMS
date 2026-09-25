package com.library.auth.infrastructure.config;

import com.library.auth.application.AuthService;
import com.library.auth.application.enums.PurposeToken;
import com.library.user.application.port.VerificationTokenGenerator;
import com.library.user.domain.entities.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class VerificationTokenGeneratorImpl implements VerificationTokenGenerator {

  private final AuthService authService;

  @Override
  public String generateVerifyEmailToken(User user) {
    return authService.generateToken(user, PurposeToken.VERIFY_EMAIL);
  }
}
