package com.library.auth.application.impl;

import com.library.auth.application.ResetPasswordUseCase;
import com.library.auth.domain.entity.PasswordResetToken;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.user.domain.entities.User;
import com.library.user.domain.repository.UserRepository;
import com.library.user.domain.valueobject.UserId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ResetPasswordUseCaseImpl implements ResetPasswordUseCase {

  private final com.library.auth.domain.repository.PasswordResetTokenRepository passwordResetTokenRepository;
  private final UserRepository userRepository;
  private final com.library.user.application.port.PasswordHasher passwordHasher;

  @Override
  @Transactional
  public void execute(com.library.auth.dto.request.ResetPasswordRequest request) {
    PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.token())
        .orElseThrow(() -> new AppException(ErrorCode.TOKEN_INVALID));

    if (resetToken.isExpired()) {
      passwordResetTokenRepository.deleteByToken(request.token());
      throw new AppException(ErrorCode.TOKEN_EXPIRED);
    }

    User user = userRepository.findById(UserId.of(resetToken.getUserId()))
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    user.resetPassword(request.newPassword(), request.confirmPassword(), passwordHasher);
    userRepository.save(user);

    passwordResetTokenRepository.deleteByToken(request.token());
  }
}
