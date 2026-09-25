package com.library.user.application.usecase.user.impl;

import com.library.shared.constant.RoleConstants;
import java.util.List;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.user.application.dto.request.RegisterUserCommand;
import com.library.user.application.port.PasswordHasher;
import com.library.user.application.port.UserEventPublisher;
import com.library.user.application.usecase.user.SignUpUseCase;
import com.library.user.domain.entities.Role;
import com.library.user.domain.entities.User;
import com.library.user.domain.event.UserRegisteredEvent;
import com.library.user.domain.repository.RoleRepository;
import com.library.user.domain.repository.UserRepository;
import com.library.user.domain.valueobject.Email;
import com.library.user.domain.valueobject.PasswordHash;
import com.library.user.domain.valueobject.UserProfile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Slf4j
@Service
@RequiredArgsConstructor
public class SignUpUseCaseImpl implements SignUpUseCase {

  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final PasswordHasher passwordHasher;
  private final UserEventPublisher userEventPublisher;

  @Override
  @Transactional
  public void execute(RegisterUserCommand request) {
    Email email = Email.of(request.email());
    if (userRepository.existsByEmail(email)) {
      throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    Role role = roleRepository.findByName(RoleConstants.STUDENT)
        .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

    UserProfile profile = UserProfile.of(request.fullName(), null, null, null, null,
        request.studentId(), request.faculty());

    PasswordHash passwordHash = PasswordHash.createFromRaw(request.password(), passwordHasher);

    User user = User.registerUser(email, passwordHash, profile, role);
    List<Object> events = user.pollDomainEvents();

    userRepository.save(user);

    events.forEach(event -> {
      if (event instanceof UserRegisteredEvent registeredEvent) {
        userEventPublisher.publish(registeredEvent);
      }
    });

    log.info("Successfully created user with ID: {}", user.getId().getValue());
  }
}
