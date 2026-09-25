package com.library.user.domain.valueobject;

import com.library.shared.exception.DomainException;
import com.library.user.application.port.PasswordHasher;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;

@Getter
@EqualsAndHashCode
@ToString(exclude = "value")
public class PasswordHash {

  private final String value;

  private PasswordHash(String value) {
    if (value == null || value.trim().isEmpty()) {
      throw new DomainException("Password hash cannot be empty");
    }
    this.value = value;
  }


  public static PasswordHash createFromRaw(String rawPassword, PasswordHasher hasher) {
    if (rawPassword == null || rawPassword.trim().isEmpty()) {
      throw new DomainException("Raw password cannot be empty");
    }
    // Logic hash nằm ở đây
    String hashed = hasher.hash(rawPassword);
    return new PasswordHash(hashed);
  }


  public static PasswordHash of(String dbHash) {
    return new PasswordHash(dbHash);
  }

  public boolean matches(String rawPassword, PasswordHasher hasher) {
    return hasher.matches(rawPassword, this.value);
  }
}