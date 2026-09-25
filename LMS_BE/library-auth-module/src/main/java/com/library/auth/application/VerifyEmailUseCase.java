package com.library.auth.application;

public interface VerifyEmailUseCase {
    void execute(String token);
}
