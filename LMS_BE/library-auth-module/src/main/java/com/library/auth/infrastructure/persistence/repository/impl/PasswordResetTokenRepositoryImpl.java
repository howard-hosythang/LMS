package com.library.auth.infrastructure.persistence.repository.impl;

import com.library.auth.domain.entity.PasswordResetToken;
import com.library.auth.domain.repository.PasswordResetTokenRepository;
import com.library.auth.infrastructure.persistence.entity.PasswordResetTokenEntity;
import com.library.auth.infrastructure.persistence.repository.PasswordResetTokenJpaRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class PasswordResetTokenRepositoryImpl implements PasswordResetTokenRepository {

  private final PasswordResetTokenJpaRepository jpaRepository;

  @Override
  public void save(PasswordResetToken token) {
    jpaRepository.save(PasswordResetTokenEntity.builder()
        .token(token.getToken())
        .userId(token.getUserId())
        .expiresAt(token.getExpiresAt())
        .build());
  }

  @Override
  public Optional<PasswordResetToken> findByToken(String token) {
    return jpaRepository.findById(token)
        .map(e -> new PasswordResetToken(e.getToken(), e.getUserId(), e.getExpiresAt()));
  }

  @Override
  public void deleteByToken(String token) {
    jpaRepository.deleteById(token);
  }

  @Override
  public void deleteByUserId(Long userId) {
    jpaRepository.deleteByUserId(userId);
  }
}
