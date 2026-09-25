package com.library.user.application.port;

public interface PasswordHasher {

  String hash(String password);

  boolean matches(String passwordRaw, String passwordHash);
}
