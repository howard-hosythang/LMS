package com.library.auth.application.impl;

import com.library.auth.application.IntrospectToken;
import com.library.auth.application.enums.PurposeToken;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.util.StaticVariable;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.interfaces.RSAPublicKey;
import java.util.Date;

@Slf4j
@Service
public class IntrospectTokenImpl implements IntrospectToken {
    @Override
    public void verifyToken(String token, RSAPublicKey publicKey, PurposeToken expectedPurpose) {
        JWTClaimsSet claimsSet = parseAndVerifyToken(token, publicKey);
        if (claimsSet == null) {
            throw new AppException(ErrorCode.TOKEN_INVALID);
        }

        // purpose access
        Object purpose = claimsSet.getClaim(StaticVariable.PURPOSE);
        if (!expectedPurpose.name().equals(purpose)) {
            log.warn("Expected purpose {}, but found {}", expectedPurpose.name(), purpose);
            throw new AppException(ErrorCode.TOKEN_INVALID);
        }

        if (claimsSet.getExpirationTime() != null && claimsSet.getExpirationTime().before(new Date())) {
            log.warn("Token has expired");
            throw new AppException(ErrorCode.TOKEN_EXPIRED);
        }

    }

    @Override
    public JWTClaimsSet parseAndVerifyToken(String token, RSAPublicKey publicKey) {
        try {
            JWSObject jwsObject = JWSObject.parse(token);
            JWSVerifier verifier = new RSASSAVerifier(publicKey);
            if (!jwsObject.verify(verifier)) {
                log.warn("Invalid token signature");
                return null;
            }
            return JWTClaimsSet.parse(jwsObject.getPayload().toJSONObject());
        } catch (Exception e) {
            log.info("get ClaimSet token failed: {}", e.getMessage());
        }
        return null;
    }
}
