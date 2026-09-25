package com.library.user.application.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateLibrarianRequest(
    @NotBlank @Email
    String email,

    @NotBlank @Size(min = 2, max = 100)
    String fullName,

    @NotBlank @Size(min = 6, max = 100)
    String password,

    @Size(max = 20)
    String librarianCode,

    @NotBlank @Size(max = 20)
    String librarianCampus,

    @NotBlank @Size(max = 20)
    String phoneNumber,

    @NotBlank @Size(max = 255)
    String address,

    @NotBlank @Size(max = 255)
    String profilePictureUrl
) {
}
