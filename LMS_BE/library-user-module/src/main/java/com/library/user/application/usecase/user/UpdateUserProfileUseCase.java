package com.library.user.application.usecase.user;

import com.library.user.application.dto.request.UpdateUserProfileCommand;
import com.library.user.application.dto.response.UserResponse;

public interface UpdateUserProfileUseCase {

  UserResponse execute(Long userId, UpdateUserProfileCommand request);
}
