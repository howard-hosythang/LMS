package com.library.auth.application;

public interface LogoutUseCase {
    void execute(String refreshToken);
}
