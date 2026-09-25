package com.library.user.application.port;

import com.library.user.domain.entities.User;

public interface VerificationTokenGenerator {

  String generateVerifyEmailToken(User user);
}
