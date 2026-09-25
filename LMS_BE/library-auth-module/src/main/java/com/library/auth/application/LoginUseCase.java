package com.library.auth.application;

import com.library.user.application.dto.request.LoginRequest;

public interface LoginUseCase {
    com.library.auth.dto.response.TokenResponse execute(LoginRequest request);
}
