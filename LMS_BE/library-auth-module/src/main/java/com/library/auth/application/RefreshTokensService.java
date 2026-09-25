package com.library.auth.application;

public interface RefreshTokensService {
    void revokeAllTokensForUser(Long userId);
    void revokeToken(String uuidToken);
    void isRefreshTokenValid(String uuidToken);
}
