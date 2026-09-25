package com.library.auth.application;

import com.library.user.application.dto.request.OnboardingProfileRequest;
import com.library.user.domain.valueobject.UserId;

public interface OnboardingProfileUseCase {
    void execute(UserId userId, OnboardingProfileRequest request);
}
