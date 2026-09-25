package com.library.user.application.usecase.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.library.shared.constant.RoleConstants;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.user.application.dto.request.RegisterUserCommand;
import com.library.user.application.port.PasswordHasher;
import com.library.user.application.port.UserEventPublisher;
import com.library.user.application.usecase.user.impl.SignUpUseCaseImpl;
import com.library.user.domain.entities.Role;
import com.library.user.domain.entities.User;
import com.library.user.domain.entities.UserStatus;
import com.library.user.domain.enums.FacultyEnum;
import com.library.user.domain.event.UserRegisteredEvent;
import com.library.user.domain.repository.RoleRepository;
import com.library.user.domain.repository.UserRepository;
import com.library.user.domain.valueobject.Email;
import com.library.user.domain.valueobject.RoleId;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("SignUpUseCase — Unit Tests")
class SignUpUseCaseTest {

  @Mock private UserRepository userRepository;
  @Mock private RoleRepository roleRepository;
  @Mock private PasswordHasher passwordHasher;
  @Mock private UserEventPublisher userEventPublisher;

  @InjectMocks private SignUpUseCaseImpl useCase;

  @Test
  @DisplayName("Đăng ký thành công tạo user INACTIVE, hash password và publish UserRegisteredEvent")
  void signUpSuccess_createsInactiveUserAndPublishesEvent() {
    RegisterUserCommand command = validCommand();
    Role studentRole = Role.of(RoleId.of(1L), RoleConstants.STUDENT, "Student");

    when(userRepository.existsByEmail(any(Email.class))).thenReturn(false);
    when(roleRepository.findByName(RoleConstants.STUDENT)).thenReturn(Optional.of(studentRole));
    when(passwordHasher.hash(command.password())).thenReturn("hashed-password");
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

    useCase.execute(command);

    ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
    verify(userRepository).save(userCaptor.capture());

    User savedUser = userCaptor.getValue();
    assertThat(savedUser.getEmail().getValue()).isEqualTo(command.email());
    assertThat(savedUser.getStatus()).isEqualTo(UserStatus.INACTIVE);
    assertThat(savedUser.getProfile().getStudentId()).isEqualTo(command.studentId());
    assertThat(savedUser.getProfile().getFaculty()).isEqualTo(command.faculty());
    assertThat(savedUser.getPasswordHash().getValue()).isEqualTo("hashed-password");
    assertThat(savedUser.getRoles()).contains(studentRole);

    ArgumentCaptor<UserRegisteredEvent> eventCaptor = ArgumentCaptor.forClass(UserRegisteredEvent.class);
    verify(userEventPublisher).publish(eventCaptor.capture());
    assertThat(eventCaptor.getValue().getEmail()).isEqualTo(command.email());
    assertThat(eventCaptor.getValue().getFullName()).isEqualTo(command.fullName());
  }

  @Test
  @DisplayName("Ném EMAIL_ALREADY_EXISTS khi email đã được sử dụng")
  void throwEmailAlreadyExists_whenEmailExists() {
    RegisterUserCommand command = validCommand();
    when(userRepository.existsByEmail(any(Email.class))).thenReturn(true);

    assertThatThrownBy(() -> useCase.execute(command))
        .isInstanceOf(AppException.class)
        .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
            .isEqualTo(ErrorCode.EMAIL_ALREADY_EXISTS));

    verify(roleRepository, never()).findByName(any());
    verify(passwordHasher, never()).hash(any());
    verify(userRepository, never()).save(any());
    verify(userEventPublisher, never()).publish(any());
  }

  @Test
  @DisplayName("Ném ROLE_NOT_FOUND khi role STUDENT chưa được seed")
  void throwRoleNotFound_whenStudentRoleMissing() {
    RegisterUserCommand command = validCommand();
    when(userRepository.existsByEmail(any(Email.class))).thenReturn(false);
    when(roleRepository.findByName(eq(RoleConstants.STUDENT))).thenReturn(Optional.empty());

    assertThatThrownBy(() -> useCase.execute(command))
        .isInstanceOf(AppException.class)
        .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
            .isEqualTo(ErrorCode.ROLE_NOT_FOUND));

    verify(passwordHasher, never()).hash(any());
    verify(userRepository, never()).save(any());
    verify(userEventPublisher, never()).publish(any());
  }

  private RegisterUserCommand validCommand() {
    return new RegisterUserCommand(
        "Nguyen Van A",
        "2213188",
        "STUDENT",
        "student@gmail.com",
        "Password123",
        "Password123",
        FacultyEnum.KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH
    );
  }
}
