package com.library.auth.application;

public interface RefreshAccessTokenUseCase {
    com.library.auth.dto.response.TokenResponse execute(String refreshToken);
}
