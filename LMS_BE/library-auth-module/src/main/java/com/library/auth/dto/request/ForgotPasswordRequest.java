package com.library.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ForgotPasswordRequest(
    @NotBlank(message = "Email is required")
    @Pattern(regexp = "(?i)^[a-z0-9._%+-]+@(gmail\\.com|hcmut\\.edu\\.vn)$", message = "Invalid email format")
    String email
) {}
