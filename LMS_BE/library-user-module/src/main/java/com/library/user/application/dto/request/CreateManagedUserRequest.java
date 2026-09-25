package com.library.user.application.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateManagedUserRequest(
    @NotBlank @Size(min = 2, max = 100)
    String fullName,

    @NotBlank @Size(max = 20)
    String studentId,

    @NotBlank @Email
    String email,

    @NotBlank @Size(min = 4, max = 50)
    String password,

    @NotBlank @Size(min = 4, max = 50)
    String confirmPassword,

    @NotBlank @Size(max = 80)
    String faculty,

    @Size(max = 20)
    String phoneNumber,

    @Size(max = 255)
    String address,

    @Size(max = 255)
    String profilePictureUrl
) {
}
