package com.library.user.domain.entities;

import com.library.shared.exception.AppException;
import com.library.shared.exception.DomainException;
import com.library.shared.exception.ErrorCode;
import com.library.user.application.port.PasswordHasher;
import com.library.user.domain.enums.FacultyEnum;
import com.library.user.domain.event.UserRegisteredEvent;
import com.library.user.domain.valueobject.Email;
import com.library.user.domain.valueobject.PasswordHash;
import com.library.user.domain.valueobject.UserId;
import com.library.user.domain.valueobject.UserProfile;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(access = AccessLevel.PRIVATE)
public class User {

  private final UserId id;
  private final Email email;
  private PasswordHash passwordHash;
  private UserProfile profile;
  private final Set<Role> roles;
  private UserStatus status;
  private LocalDateTime lastLoginAt;
  private final String provider;
  private final String providerId;
  private int creditScore;
  private int contributionScore;

  // Domain events
  private final List<Object> domainEvents = new ArrayList<>();


  private static final int DEFAULT_SCORE = 100;

  public static User createForMapper(UserId id,
      Email email,
      PasswordHash passwordHash,
      UserProfile profile,
      Set<Role> roles,
      UserStatus status,
      LocalDateTime lastLoginAt,
      String provider,
      String providerId,
      int creditScore,
      int contributionScore) {
    return User.builder()
        .id(id)
        .email(email)
        .passwordHash(passwordHash)
        .profile(profile)
        .roles(roles)
        .status(status)
        .lastLoginAt(lastLoginAt)
        .provider(provider)
        .providerId(providerId)
        .creditScore(creditScore)
        .contributionScore(contributionScore)
        .build();
  }

  public static User createUserForInitializer(
      Email email,
      PasswordHash passwordHash,
      UserProfile profile,
      Role defaultRole) {

    UserId id = UserId.generate();

    Set<Role> roles = new HashSet<>();
    roles.add(defaultRole);

    return User.builder()
        .id(id)
        .email(email)
        .passwordHash(passwordHash)
        .roles(roles)
        .status(UserStatus.ACTIVE)
        .profile(profile)
        .creditScore(DEFAULT_SCORE)
        .contributionScore(0)
        .build();
  }

  public static User registerUser(Email email, PasswordHash passwordHash, UserProfile profile,
      Role defaultRole) {
    UserId id = UserId.generate();
    Set<Role> roles = new HashSet<>();
    roles.add(defaultRole);

    User user = User.builder()
        .id(id)
        .email(email)
        .passwordHash(passwordHash)
        .roles(roles)
        .status(UserStatus.INACTIVE)
        .profile(profile)
        .creditScore(DEFAULT_SCORE)
        .contributionScore(0)
        .build();

    user.addDomainEvent(new UserRegisteredEvent(user.getId(), user.getEmail().getValue(),
        user.getProfile().getFullName()));

    return user;
  }

  public static User createByOauth2(
      Email email,
      UserProfile profile,
      String provider,
      String providerId,
      Role defaultRole
  ) {
    UserId id = UserId.generate();

    Set<Role> roles = new HashSet<>();
    roles.add(defaultRole);

    return User.builder()
        .id(id)
        .email(email)
        .profile(profile)
        .roles(roles)
        .status(UserStatus.ACTIVE)
        .provider(provider)
        .providerId(providerId)
        .creditScore(DEFAULT_SCORE)
        .contributionScore(0)
        .build();
  }

  // onboarding profile
  public void completeOnboardingProfile(String studentId, String phoneNumber, FacultyEnum faculty) {
    if (studentId == null || studentId.trim().isEmpty()) {
      throw new DomainException("Student ID cannot be null or empty");
    }
    if (faculty == null) {
      throw new DomainException("Faculty cannot be null");
    }
    this.profile = this.profile
        .withStudentId(studentId.trim())
        .withPhoneNumber(phoneNumber != null && !phoneNumber.isBlank() ? phoneNumber.trim() : null)
        .withFaculty(faculty);
  }

  // ============== Role Management ==============
  public void assignRole(Role role) {
    if (role == null) {
      throw new IllegalArgumentException("Role cannot be null");
    }

    if (this.roles.contains(role)) {
      throw new IllegalStateException("User already has this role");
    }

    this.roles.add(role);
  }

  public Set<Role> getRoles() {
    return Collections.unmodifiableSet(roles);
  }

  public void activeAccount() {
    if (this.status == UserStatus.ACTIVE) {
      throw new DomainException("User is already active");
    }
    this.status = UserStatus.ACTIVE;
  }

  public void validateStatus() {
    if (status == UserStatus.LOCKED) {
      throw new AppException(ErrorCode.USER_LOCKED);
    }
    if (status == UserStatus.INACTIVE) {
      throw new AppException(ErrorCode.USER_EMAIL_NOT_VERIFIED);
    }
    if (status == UserStatus.BANNED) {
      throw new AppException(ErrorCode.USER_BANNED);
    }
  }

  public void changePassword(String oldPassword, String newPassword, String confirmPassword,
      PasswordHasher hasher) {
    if (newPassword == null || newPassword.trim().isEmpty()) {
      throw new DomainException("New password cannot be null or empty");
    }
    if (confirmPassword == null || confirmPassword.trim().isEmpty()) {
      throw new DomainException("Confirm password cannot be null or empty");
    }
    if (!newPassword.equals(confirmPassword)) {
      throw new DomainException("New password and confirm password do not match");
    }
    if (oldPassword == null || oldPassword.trim().isEmpty()) {
      throw new DomainException("Old password cannot be null or empty");
    }

    if (this.passwordHash == null || !this.passwordHash.matches(oldPassword, hasher)) {
      throw new DomainException("Invalid password");
    }

    this.passwordHash = PasswordHash.createFromRaw(newPassword, hasher);
  }

  public void resetPassword(String newPassword, String confirmPassword, PasswordHasher hasher) {
    if (newPassword == null || newPassword.trim().isEmpty()) {
      throw new DomainException("New password cannot be null or empty");
    }
    if (!newPassword.equals(confirmPassword)) {
      throw new DomainException("New password and confirm password do not match");
    }
    this.passwordHash = PasswordHash.createFromRaw(newPassword, hasher);
  }


  public void verifyPassword(String newPassword, PasswordHasher hasher) {
    if (newPassword == null || newPassword.trim().isEmpty()) {
      throw new DomainException("Password cannot be null or empty");
    }
    if (this.passwordHash == null || !this.passwordHash.matches(newPassword, hasher)) {
      throw new DomainException("Email or password is incorrect");
    }
  }

  public void updateProfile(UserProfile profile) {
    if (profile == null) {
      throw new DomainException("Profile cannot be null");
    }
    this.profile = profile;
  }

  // ============== Domain Events ==============

  private void addDomainEvent(Object event) {
    this.domainEvents.add(event);
  }

  public List<Object> pollDomainEvents() {
    List<Object> events = new ArrayList<>(this.domainEvents);
    this.domainEvents.clear();
    return events;
  }
}
