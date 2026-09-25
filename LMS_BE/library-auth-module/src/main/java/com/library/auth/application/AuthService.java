package com.library.auth.application;

import com.library.auth.application.enums.PurposeToken;
import com.library.user.domain.entities.User;
import com.nimbusds.jwt.JWTClaimsSet;

public interface AuthService {
    String generateToken(User user, PurposeToken purpose);
    com.library.auth.dto.response.TokenResponse oauth2CallBack(String loginType, String code, String deviceId);
    User getUserFromClaims(JWTClaimsSet claimsSet);
}
