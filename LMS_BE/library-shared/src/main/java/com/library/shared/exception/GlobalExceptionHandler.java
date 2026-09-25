package com.library.shared.exception;

import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.library.shared.dto.ApiResponseApp;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private String resolveMessage(ErrorCode errorCode, WebRequest request) {
        String lang = request.getHeader("Accept-Language");
        return (lang != null && lang.startsWith("vi"))
            ? errorCode.getMessageVi()
            : errorCode.getMessage();
    }

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponseApp<?>> handleAppException(AppException e, WebRequest request) {
        ErrorCode errorCode = e.getErrorCode();
        return ResponseEntity
                .status(errorCode.getStatus())
                .body(ApiResponseApp.error(errorCode.getCode(), resolveMessage(errorCode, request)));
    }

    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ApiResponseApp<?>> handleDomainException(DomainException e) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponseApp.error(400,e.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponseApp<?>> handleInvalidFormatException(HttpMessageNotReadableException e) {
        String errorDetails = "Invalid JSON format";

        if (e.getCause() instanceof InvalidFormatException) {
            InvalidFormatException ife = (InvalidFormatException) e.getCause();
            errorDetails = String.format("Giá trị '%s' không đúng định dạng cho kiểu dữ liệu %s",
                    ife.getValue(), ife.getTargetType().getSimpleName());
        } else {
            errorDetails = e.getMostSpecificCause().getMessage();
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponseApp.error(HttpStatus.BAD_REQUEST.value(), errorDetails));
    }




    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponseApp<?>> handleIllegalArgumentException(IllegalArgumentException e) {
        log.error("IllegalArgumentException: {}", e.getMessage(), e);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponseApp.error(HttpStatus.BAD_REQUEST.value(), e.getMessage()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponseApp<?>> handleResponseStatusException(ResponseStatusException e) {
        HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
        HttpStatus responseStatus = status != null ? status : HttpStatus.INTERNAL_SERVER_ERROR;
        String message = e.getReason() != null ? e.getReason() : responseStatus.getReasonPhrase();

        return ResponseEntity
                .status(responseStatus)
                .body(ApiResponseApp.error(responseStatus.value(), message));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponseApp<?>> handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
        // 1. Lấy ra lỗi đầu tiên trong danh sách các lỗi validation (để message ngắn gọn)
        String errorMessage = e.getBindingResult().getFieldErrors().stream()
                .map(DefaultMessageSourceResolvable::getDefaultMessage)
                .findFirst()
                .orElse("Validation failed");

        log.error("Validation failed: {}", errorMessage);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponseApp.error(HttpStatus.BAD_REQUEST.value(), errorMessage));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponseApp<?>> handleIllegalStateException(IllegalStateException e) {
        log.error("IllegalStateException: {}", e.getMessage(), e);
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponseApp.error(HttpStatus.CONFLICT.value(), e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponseApp<?>> handleGenericException(Exception e) {
        log.error("Unexpected exception: {}", e.getMessage(), e);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponseApp.error(
                    HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    e.getMessage() != null? e.getMessage() : "An unexpected error occurred. Please contact support."
                ));
    }
}
