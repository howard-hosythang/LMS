package com.library.auth.infrastructure.config;

import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.AccountExpiredException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CustomAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {
    private final UserDetailsService userDetailsService;
    
    @Autowired
    public CustomAuthenticationConverter(UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Override
    public AbstractAuthenticationToken convert(@NonNull Jwt jwt) {
        String userId = jwt.getSubject();
        UserDetails userDetails = userDetailsService.loadUserByUsername(userId);
        if (!userDetails.isAccountNonLocked()) throw new LockedException("User locked", new AppException(ErrorCode.USER_LOCKED));
        if (!userDetails.isEnabled()) throw new DisabledException("User disabled", new AppException(ErrorCode.USER_EMAIL_NOT_VERIFIED));
        if (!userDetails.isAccountNonExpired()) throw new AccountExpiredException("Account Banned", new AppException(ErrorCode.USER_BANNED));
        if (!userDetails.isCredentialsNonExpired()) throw new CredentialsExpiredException("Password expired", new AppException(ErrorCode.PASSWORD_EXPIRED));

        log.info("authorities: {}", userDetails.getAuthorities());
        return new UsernamePasswordAuthenticationToken(userDetails, jwt, userDetails.getAuthorities());
    }
}
