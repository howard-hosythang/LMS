package com.library.user.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginRequest {
    @NotBlank(message = "Email is required")
    @Pattern(regexp = "(?i)^[a-z0-9._%+-]+@(gmail\\.com|hcmut\\.edu\\.vn)$", message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}
