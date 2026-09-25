package com.library.user.application.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.time.Instant;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record LibrarianAccountResponse(
    @JsonSerialize(using = ToStringSerializer.class)
    Long id,
    String email,
    String fullName,
    String phoneNumber,
    String librarianCode,
    String librarianCampus,
    String address,
    String profilePictureUrl,
    String status,
    boolean verified,
    Instant createdAt,
    Instant accountActivatedAt,
    LocalDateTime lastLoginAt
) {
}
