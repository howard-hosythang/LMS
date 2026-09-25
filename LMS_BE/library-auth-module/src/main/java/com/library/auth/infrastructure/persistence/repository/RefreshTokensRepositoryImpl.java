package com.library.auth.infrastructure.persistence.repository;

import com.library.auth.domain.entity.RefreshTokens;
import com.library.auth.domain.repository.RefreshTokensRepository;
import com.library.auth.infrastructure.persistence.entity.RefreshTokensEntity;
import com.library.auth.infrastructure.persistence.mapper.RefreshTokensEntityMapper;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public class RefreshTokensRepositoryImpl implements RefreshTokensRepository {
    private final RefreshTokensJpaRepository refreshTokensJpaRepository;
    private final RefreshTokensEntityMapper refreshTokensEntityMapper;

    public RefreshTokensRepositoryImpl(RefreshTokensJpaRepository refreshTokensJpaRepository, RefreshTokensEntityMapper refreshTokensEntityMapper) {
        this.refreshTokensJpaRepository = refreshTokensJpaRepository;
        this.refreshTokensEntityMapper = refreshTokensEntityMapper;
    }

    @Override
    public List<RefreshTokens> findAllByUserId(Long userId) {
        return refreshTokensJpaRepository.findAllByUserId(userId).stream()
                .map(refreshTokensEntityMapper::toDomain)
                .toList();
    }

    @Override
    public int deleteExpiredTokens(Instant now) {
        return refreshTokensJpaRepository.deleteExpiredTokens(now);
    }

    @Override
    public void deleteByUserIdAndDeviceId(Long userId, String deviceId) {
        refreshTokensJpaRepository.deleteByUserIdAndDeviceId(userId, deviceId);
    }

    @Override
    public void flush() {
        refreshTokensJpaRepository.flush();
    }

    @Override
    public void save(RefreshTokens refreshTokens) {
        RefreshTokensEntity entity = refreshTokensEntityMapper.toEntity(refreshTokens);
        refreshTokensJpaRepository.save(entity);
    }

    @Override
    public void revokeAllByUserId(Long userId) {
        refreshTokensJpaRepository.revokeAllByUserId(userId);
    }

    @Override
    public void revokeToken(String uuidToken) {
        refreshTokensJpaRepository.revokeToken(uuidToken);
    }

    @Override
    public RefreshTokens findById(String uuidToken) {
        return refreshTokensJpaRepository.findById(uuidToken).map(refreshTokensEntityMapper::toDomain).orElse(null);
    }

    @Override
    public void upsertRefreshToken(RefreshTokens refreshTokens) {
        refreshTokensJpaRepository.upsertRefreshToken(
                refreshTokens.getUserId(),
                refreshTokens.getDeviceId(),
                refreshTokens.getId().getValue(),
                refreshTokens.getExpiryDate()
        );
    }

}
