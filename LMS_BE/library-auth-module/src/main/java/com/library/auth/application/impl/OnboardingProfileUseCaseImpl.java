package com.library.auth.application.impl;

import com.library.auth.application.OnboardingProfileUseCase;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.user.application.dto.request.OnboardingProfileRequest;
import com.library.user.domain.entities.User;
import com.library.user.domain.repository.UserRepository;
import com.library.user.domain.valueobject.UserId;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OnboardingProfileUseCaseImpl implements OnboardingProfileUseCase {
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void execute(UserId userId, OnboardingProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.completeOnboardingProfile(request.studentId(), request.phoneNumber(), request.faculty());
        userRepository.save(user);
    }
}
