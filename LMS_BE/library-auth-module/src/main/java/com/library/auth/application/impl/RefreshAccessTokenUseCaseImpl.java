package com.library.auth.application.impl;

import com.library.auth.application.AuthService;
import com.library.auth.application.RefreshAccessTokenUseCase;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.util.StaticVariable;
import com.library.user.domain.entities.User;
import com.nimbusds.jwt.JWTClaimsSet;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class RefreshAccessTokenUseCaseImpl implements RefreshAccessTokenUseCase {
    private final com.library.auth.application.IntrospectToken introspectToken;
    private final com.library.auth.properties.RSAKeyRecord rSAKeyRecord;
    private final AuthService authService;
    private final com.library.auth.application.RefreshTokensService refreshTokensService;

    @Override
    public com.library.auth.dto.response.TokenResponse execute(String refreshToken) {
        log.info("begin refresh Token");

        JWTClaimsSet claimsSet = introspectToken.parseAndVerifyToken(refreshToken, rSAKeyRecord.rsaPublicKey());
        if (claimsSet == null || !com.library.auth.application.enums.PurposeToken.REFRESH.name().equals(claimsSet.getClaim(StaticVariable.PURPOSE))) {
            throw new AppException(ErrorCode.TOKEN_INVALID);
        }

        if (claimsSet.getExpirationTime().before(new Date())) {
            throw new AppException(ErrorCode.TOKEN_EXPIRED);
        }
        User user = authService.getUserFromClaims(claimsSet);

        // check it into db
        refreshTokensService.isRefreshTokenValid(claimsSet.getJWTID());

        // generate a new access token
        String accessToken = authService.generateToken(user, com.library.auth.application.enums.PurposeToken.ACCESS);

        return com.library.auth.dto.response.TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }
}
