package com.library.user.application.mapper;

import com.library.user.application.dto.request.UpdateUserProfileCommand;
import com.library.user.application.dto.response.RoleResponse;
import com.library.user.application.dto.response.UserResponse;
import com.library.user.domain.entities.Role;
import com.library.user.domain.entities.User;
import com.library.user.domain.valueobject.UserProfile;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

  /**
   * Map UserAggregate to UserResponse
   */
  public UserResponse toResponse(User user) {
    if (user == null) {
      return null;
    }

    UserProfile profile = user.getProfile();
    Set<RoleResponse> roles = user.getRoles() == null
        ? null
        : user.getRoles().stream()
            .map(this::toRoleResponse)
            .collect(Collectors.toSet());
    Boolean canChangePassword = user.getPasswordHash() != null
        && user.getPasswordHash().getValue() != null
        && !user.getPasswordHash().getValue().isBlank();

    return new UserResponse(
        user.getId() != null ? user.getId().getValue() : null,
        user.getEmail() != null ? user.getEmail().getValue() : null,
        profile != null ? profile.getFullName() : null,
        profile != null ? profile.getDateOfBirth() : null,
        profile != null ? profile.getPhoneNumber() : null,
        profile != null ? profile.getStudentId() : null,
        profile != null && profile.getFaculty() != null ? profile.getFaculty().name() : null,
        profile != null ? profile.getAddress() : null,
        profile != null ? profile.getProfilePictureUrl() : null,
        roles,
        user.getStatus() != null ? user.getStatus().name() : null,
        user.getLastLoginAt(),
        canChangePassword,
        (long) user.getCreditScore(),
        (long) user.getContributionScore()
    );
  }

  public RoleResponse toRoleResponse(Role role) {
    if (role == null) {
      return null;
    }

    return new RoleResponse(
        role.getId() != null ? role.getId().getValue() : null,
        role.getRoleName(),
        role.getDescription()
    );
  }

  /**
   * Helper method to create UserProfile from update
   */
  public UserProfile mergeAndMapToUserProfile(UserProfile currentProfile,
      UpdateUserProfileCommand request) {
    if (request == null) {
      return null;
    }

    return UserProfile.of(
        request.fullName() != null ? request.fullName() : currentProfile.getFullName(),
        request.dateOfBirth() != null ? request.dateOfBirth() : currentProfile.getDateOfBirth(),
        request.phoneNumber() != null ? request.phoneNumber() : currentProfile.getPhoneNumber(),
        request.address() != null ? request.address() : currentProfile.getAddress(),
        currentProfile.getProfilePictureUrl(),
        currentProfile.getStudentId(),
        request.faculty() != null ? request.faculty() : currentProfile.getFaculty()
    );
  }

}
