package com.library.auth.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import com.library.auth.properties.RSAKeyRecord;

@Configuration
public class NimbusDecoderImpl {

    @Bean
    public NimbusJwtDecoder nimbusJwtDecoder(RSAKeyRecord rsaKeyRecord) {
        return NimbusJwtDecoder
                .withPublicKey(rsaKeyRecord.rsaPublicKey())
                .signatureAlgorithm(SignatureAlgorithm.RS256)
                .build();
    }
}
