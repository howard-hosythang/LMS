package com.library.auth.infrastructure.config;

import com.library.user.application.port.PasswordHasher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PasswordHasherImpl implements PasswordHasher {

  private final PasswordEncoder passwordEncoder;

  public PasswordHasherImpl(PasswordEncoder passwordEncoder) {
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  public String hash(String password) {
    return passwordEncoder.encode(password);
  }

  @Override
  public boolean matches(String passwordRaw, String passwordHash) {
    return passwordEncoder.matches(passwordRaw, passwordHash);
  }
}
