package com.library.auth.domain.repository;

import com.library.auth.domain.entity.PasswordResetToken;
import java.util.Optional;

public interface PasswordResetTokenRepository {

  void save(PasswordResetToken token);

  Optional<PasswordResetToken> findByToken(String token);

  void deleteByToken(String token);

  void deleteByUserId(Long userId);
}
