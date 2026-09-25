package com.library.user.application.dto.request;

import com.library.user.domain.enums.FacultyEnum;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterUserCommand(
    @NotBlank(message = "Full name is required")
    @Pattern(regexp = "^[\\p{L}\\s]+$", message = "Full name must contain only letters")
    String fullName,

    @NotBlank(message = "Student/Lecturer ID is required")
    String studentId,

    String identityType,

    @NotBlank(message = "Email is required")
    @Pattern(regexp = "(?i)^[a-z0-9._%+-]+@(gmail\\.com|hcmut\\.edu\\.vn)$", message = "Invalid email format")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 4, max = 50, message = "Password must be at least 4 characters")
    String password,

    @NotBlank(message = "Confirm password is required")
    @Size(min = 4, max = 50, message = "Password must be at least 4 characters")
    String confirmPassword,

    FacultyEnum faculty
) {

  @AssertTrue(message = "Student ID must be 7 digits, lecturer staff ID must be 3-20 letters or digits")
  public boolean isValidIdentityCode() {
    if (studentId == null || studentId.isBlank()) {
      return false;
    }
    String type = identityType == null || identityType.isBlank()
        ? "STUDENT"
        : identityType.trim().toUpperCase();
    String code = studentId.trim();
    if ("LECTURER".equals(type)) {
      return code.matches("[A-Za-z0-9]{3,20}");
    }
    return code.matches("\\d{7}");
  }
}
