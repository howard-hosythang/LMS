package com.library.auth.infrastructure.config;

import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {
    private final SecurityErrorResponseUtil securityErrorResponseUtil;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException {
        AppException appEx = extractAppException(authException);
        if (appEx != null) {
            securityErrorResponseUtil.writeErrorResponse(response, appEx.getErrorCode());
        }
        else
            securityErrorResponseUtil.writeErrorResponse(response, ErrorCode.UNAUTHENTICATED);
    }

    private AppException extractAppException(Throwable ex) {
        while (ex != null) {
            if (ex instanceof AppException appException) {
                return appException;
            }
            ex = ex.getCause();
        }
        return null;
    }
}
