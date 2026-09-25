package com.library.auth.domain.entity;

import java.time.Instant;
import lombok.Getter;

@Getter
public class PasswordResetToken {

  private final String token;
  private final Long userId;
  private final Instant expiresAt;

  public PasswordResetToken(String token, Long userId, Instant expiresAt) {
    this.token = token;
    this.userId = userId;
    this.expiresAt = expiresAt;
  }

  public boolean isExpired() {
    return Instant.now().isAfter(expiresAt);
  }
}
