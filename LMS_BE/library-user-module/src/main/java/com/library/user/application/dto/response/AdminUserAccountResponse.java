package com.library.user.application.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record AdminUserAccountResponse(
    @JsonSerialize(using = ToStringSerializer.class)
    Long id,
    String email,
    String fullName,
    String phoneNumber,
    String studentId,
    String librarianCampus,
    String faculty,
    String address,
    String profilePictureUrl,
    String status,
    boolean verified,
    List<String> roles,
    Instant createdAt,
    Instant accountActivatedAt,
    LocalDateTime lastLoginAt
) {
}
