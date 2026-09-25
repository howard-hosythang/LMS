package com.library.auth.application;
import com.nimbusds.jwt.JWTClaimsSet;
import com.library.auth.application.enums.PurposeToken;

import java.security.interfaces.RSAPublicKey;

public interface IntrospectToken {
    void verifyToken(String token, RSAPublicKey publicKey, PurposeToken expectedPurpose);
    JWTClaimsSet parseAndVerifyToken(String token, RSAPublicKey publicKey);
}
