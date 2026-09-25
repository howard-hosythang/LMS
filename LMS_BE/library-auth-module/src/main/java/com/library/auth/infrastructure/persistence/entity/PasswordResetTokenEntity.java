package com.library.auth.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "password_reset_tokens")
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PasswordResetTokenEntity {

  @Id
  private String token;

  @Column(nullable = false)
  private Long userId;

  @Column(nullable = false)
  private Instant expiresAt;
}
