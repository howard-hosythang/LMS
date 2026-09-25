package com.library.auth.application;

import com.library.auth.dto.request.ForgotPasswordRequest;

public interface ForgotPasswordUseCase {

  void execute(ForgotPasswordRequest request);
}
