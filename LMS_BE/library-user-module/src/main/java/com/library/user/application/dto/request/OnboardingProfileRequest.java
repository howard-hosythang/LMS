package com.library.user.application.dto.request;

import com.library.user.domain.enums.FacultyEnum;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record OnboardingProfileRequest(
        @NotNull(message = "Student/Lecturer ID is required")
        String studentId,
        String identityType,
        @Size(max = 20, message = "Phone number is too long")
        String phoneNumber,
        FacultyEnum faculty
){
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
