package com.library.user.application.usecase.user;

import com.library.user.application.dto.request.ChangePasswordRequest;

public interface ChangePasswordUseCase{
    void execute(ChangePasswordRequest request, Long userId);
}
