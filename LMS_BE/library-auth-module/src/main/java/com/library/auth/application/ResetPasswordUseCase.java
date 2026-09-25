package com.library.auth.application;

import com.library.auth.dto.request.ResetPasswordRequest;

public interface ResetPasswordUseCase {

  void execute(ResetPasswordRequest request);
}
