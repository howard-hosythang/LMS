package com.library.auth.application.impl;

import com.library.auth.application.LoginUseCase;
import com.library.auth.application.enums.PurposeToken;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.user.application.dto.request.LoginRequest;
import com.library.user.application.port.PasswordHasher;
import com.library.user.domain.entities.User;
import com.library.user.domain.repository.UserRepository;
import com.library.user.domain.valueobject.Email;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LoginUseCaseImpl implements LoginUseCase {

  private final UserRepository userRepository;
  private final PasswordHasher passwordHasher;
  private final AuthServiceImpl authService;

  @Override
  @Transactional
  public com.library.auth.dto.response.TokenResponse execute(LoginRequest request) {
    User user = userRepository.findByEmail(Email.of(request.getEmail())).orElseThrow(
        () -> new AppException(ErrorCode.EMAIL_OR_PASSWORD_INCORRECT)
    );
    // throw if not active
    user.validateStatus();

    // check password
    user.verifyPassword(request.getPassword(), passwordHasher);

    // Here you would typically generate a JWT token or similar
    String accessToken = authService.generateToken(user, PurposeToken.ACCESS);
    String refreshToken = authService.generateToken(user, PurposeToken.REFRESH);

    return com.library.auth.dto.response.TokenResponse.builder()
        .accessToken(accessToken)
        .refreshToken(refreshToken)
        .build();
  }
}
