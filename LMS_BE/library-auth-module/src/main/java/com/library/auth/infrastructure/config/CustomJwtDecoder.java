package com.library.auth.infrastructure.config;

import com.library.auth.application.IntrospectToken;
import com.library.auth.application.enums.PurposeToken;
import com.library.auth.properties.RSAKeyRecord;
import com.library.shared.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CustomJwtDecoder implements JwtDecoder {
    private final IntrospectToken introspectToken;
    private final NimbusJwtDecoder nimbusJwtDecoder;
    private final RSAKeyRecord rsaKeyRecord;

    @Override
    public Jwt decode(String token) {
        try {
            introspectToken.verifyToken(token, rsaKeyRecord.rsaPublicKey(), PurposeToken.ACCESS);
        } catch (AppException e) {
            throw new BadJwtException(e.getMessage(), e);
        }
        return nimbusJwtDecoder.decode(token);
    }

}
