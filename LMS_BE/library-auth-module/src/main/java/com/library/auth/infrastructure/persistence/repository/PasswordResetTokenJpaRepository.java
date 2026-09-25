package com.library.auth.infrastructure.persistence.repository;

import com.library.auth.infrastructure.persistence.entity.PasswordResetTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenJpaRepository extends JpaRepository<PasswordResetTokenEntity, String> {

  void deleteByUserId(Long userId);
}
