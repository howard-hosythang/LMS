package com.library.auth.infrastructure.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.shared.dto.ApiResponseApp;
import com.library.shared.exception.ErrorCode;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class SecurityErrorResponseUtil {
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void writeErrorResponse(HttpServletResponse response, ErrorCode errorCode) throws IOException {
        response.setStatus(errorCode.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        // create error response
        ApiResponseApp<?> apiResponse = ApiResponseApp.error(errorCode.getCode(), errorCode.getMessage());

        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
        response.flushBuffer();
    }
}
