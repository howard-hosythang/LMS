package com.library.auth.application.impl;

import com.library.auth.application.VerifyEmailUseCase;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.util.StaticVariable;
import com.library.user.domain.entities.User;
import com.library.user.domain.repository.UserRepository;
import com.library.user.domain.valueobject.UserId;
import com.nimbusds.jwt.JWTClaimsSet;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VerifyEmailUseCaseImpl implements VerifyEmailUseCase {

  private final com.library.auth.application.IntrospectToken introspectToken;
  private final com.library.auth.properties.RSAKeyRecord rSAKeyRecord;
  private final UserRepository userRepository;

  @Override
  @Transactional
  public void execute(String token) {
    JWTClaimsSet claimsSet = introspectToken.parseAndVerifyToken(token,
        rSAKeyRecord.rsaPublicKey());
    if (claimsSet == null || !com.library.auth.application.enums.PurposeToken.VERIFY_EMAIL.name()
        .equals(claimsSet.getClaim(StaticVariable.PURPOSE))) {
      throw new AppException(ErrorCode.VERIFY_EMAIL_FAILED);
    }

    Long userId = Long.valueOf(claimsSet.getSubject());
    User user = userRepository.findById(UserId.of(userId)).orElseThrow(
        () -> new AppException(ErrorCode.USER_NOT_FOUND)
    );
    user.activeAccount();
    userRepository.save(user);
  }
}
