package com.library.user.application.usecase.user;

import com.library.user.application.dto.response.UserResponse;
import org.springframework.web.multipart.MultipartFile;

public interface UploadAvatarUseCase {
    UserResponse execute(Long userId, MultipartFile file);
}
