package com.library.shared.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponseApp<T>{
    private final int code;
    private final String message;
    private final T data;

    public ApiResponseApp(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    // 1. Get and update 200 OK (Có data)
    public static <T> ApiResponseApp<T> success(T data) {
        return new ApiResponseApp<>(HttpStatus.OK.value(), "Success", data);
    }

    public static <T> ApiResponseApp<T> success(String message) {
        return new ApiResponseApp<>(HttpStatus.OK.value(), message, null);
    }

    public static <T> ApiResponseApp<T> success(String message,T data) {
        return new ApiResponseApp<>(HttpStatus.OK.value(), message, data);
    }

    // 2. Created 201 (Dùng cho POST)
    public static <T> ApiResponseApp<T> created(T data) {
        return new ApiResponseApp<>(HttpStatus.CREATED.value(), "Created successfully", data);
    }

    public static <T> ApiResponseApp<T> created(String message, T data) {
        return new ApiResponseApp<>(HttpStatus.CREATED.value(), message, data);
    }

    // 3. Delete 200 OK (Không có data trả về)
    public static <T> ApiResponseApp<T> deleteSuccess() {
        return new ApiResponseApp<>(HttpStatus.OK.value(), "Deleted Successfully", null);
    }

    public static <T> ApiResponseApp<T> deleteSuccess(String message) {
        return new ApiResponseApp<>(HttpStatus.OK.value(), message, null);
    }

    // 4. Custom Error (Dùng cho Exception Handler)
    public static <T> ApiResponseApp<T> error(int code, String message) {
        return new ApiResponseApp<>(code, message, null);
    }
}
