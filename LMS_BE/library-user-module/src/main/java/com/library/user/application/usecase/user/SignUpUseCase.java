package com.library.user.application.usecase.user;

import com.library.user.application.dto.request.RegisterUserCommand;

public interface SignUpUseCase {

  void execute(RegisterUserCommand request);
}
