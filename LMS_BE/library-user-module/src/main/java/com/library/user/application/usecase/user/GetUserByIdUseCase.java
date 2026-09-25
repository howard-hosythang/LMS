package com.library.user.application.usecase.user;

import com.library.user.application.dto.response.UserResponse;

public interface GetUserByIdUseCase {

  UserResponse execute(Long userId);
}
