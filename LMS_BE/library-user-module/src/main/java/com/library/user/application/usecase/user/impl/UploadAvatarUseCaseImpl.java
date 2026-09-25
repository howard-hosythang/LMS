package com.library.user.application.usecase.user.impl;

import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.user.application.dto.response.UserResponse;
import com.library.user.application.mapper.UserMapper;
import com.library.user.application.usecase.user.UploadAvatarUseCase;
import com.library.user.domain.entities.User;
import com.library.user.domain.repository.UserRepository;
import com.library.user.domain.valueobject.UserId;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class UploadAvatarUseCaseImpl implements UploadAvatarUseCase {

    private final UserRepository userRepository;
    private final com.library.shared.port.StoragePort storagePort;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public UserResponse execute(Long userId, MultipartFile file) {
        User user = userRepository.findById(UserId.of(userId))
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String avatarUrl = storagePort.upload(file, "avatars/" + userId);

        user.updateProfile(user.getProfile().withProfilePictureUrl(avatarUrl));
        User saved = userRepository.save(user);

        log.info("Avatar updated for userId={}", userId);
        return userMapper.toResponse(saved);
    }
}
