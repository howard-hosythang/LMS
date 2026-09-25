package com.library.user.application.usecase.user.impl;

import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.user.application.dto.request.ChangePasswordRequest;
import com.library.user.application.port.PasswordHasher;
import com.library.user.application.usecase.user.ChangePasswordUseCase;
import com.library.user.domain.entities.User;
import com.library.user.domain.repository.UserRepository;
import com.library.user.domain.valueobject.UserId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChangePasswordUseCaseImpl implements ChangePasswordUseCase {

  private final UserRepository userRepository;
  private final PasswordHasher passwordHasher;

  @Override
  @Transactional
  public void execute(ChangePasswordRequest request, Long userId) {
    User user = userRepository.findById(UserId.of(userId))
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    user.changePassword(
        request.currentPassword(),
        request.newPassword(),
        request.confirmPassword(),
        passwordHasher
    );

    userRepository.save(user);
  }
}
