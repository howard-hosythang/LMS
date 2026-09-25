package com.library.auth.application.impl;

import com.library.auth.application.RefreshTokensService;
import com.library.auth.domain.entity.RefreshTokens;
import com.library.auth.domain.repository.RefreshTokensRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RefreshTokensServiceImpl implements RefreshTokensService {
    private final RefreshTokensRepository refreshTokensRepository;

    public RefreshTokensServiceImpl(RefreshTokensRepository refreshTokensRepository) {
        this.refreshTokensRepository = refreshTokensRepository;
    }

    @Override
    @Transactional
    public void revokeAllTokensForUser(Long userId) {
        refreshTokensRepository.revokeAllByUserId(userId);
    }

    @Override
    @Transactional
    public void revokeToken(String uuidToken) {
        refreshTokensRepository.revokeToken(uuidToken);
    }

    @Override
    @Transactional(readOnly = true)
    public void isRefreshTokenValid(String uuidToken) {
        RefreshTokens refreshToken = refreshTokensRepository.findById(uuidToken);
        if (refreshToken == null || refreshToken.isExpiredOrRevoked()) {
            throw new AppException(ErrorCode.TOKEN_REFRESH_FAILED);
        }
    }
}
