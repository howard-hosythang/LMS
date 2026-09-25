package com.library.auth.infrastructure.config;

import com.library.shared.exception.ErrorCode;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {
    private final SecurityErrorResponseUtil securityErrorResponseUtil;

    public CustomAccessDeniedHandler(SecurityErrorResponseUtil securityErrorResponseUtil) {
        this.securityErrorResponseUtil = securityErrorResponseUtil;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws IOException, ServletException {
        securityErrorResponseUtil.writeErrorResponse(response, ErrorCode.FORBIDDEN);
    }
}
