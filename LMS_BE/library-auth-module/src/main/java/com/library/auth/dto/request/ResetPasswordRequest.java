package com.library.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
    @NotBlank(message = "Token is required")
    String token,

    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 50, message = "Password must be between 8 and 50 characters")
    String newPassword,

    @NotBlank(message = "Confirm password is required")
    @Size(min = 8, max = 50, message = "Password must be between 8 and 50 characters")
    String confirmPassword
) {}
