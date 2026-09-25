package com.library.user.application.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

public record UserResponse(
    @JsonSerialize(using = ToStringSerializer.class)
    Long id,
    String email,
    String fullName,
    LocalDate dateOfBirth,
    String phoneNumber,
    String studentId,
    String faculty,
    String address,
    String profilePictureUrl,
    Set<RoleResponse> roles,
    String status,
    LocalDateTime lastLoginAt,
    Boolean canChangePassword,
    Long creditScore,
    Long contributionScore
) {

}
