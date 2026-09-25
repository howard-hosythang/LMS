package com.library.auth.domain.repository;

import com.library.auth.domain.entity.RefreshTokens;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface RefreshTokensRepository {

    List<RefreshTokens> findAllByUserId(Long userId);

    int deleteExpiredTokens(@Param("now") Instant now);

    void deleteByUserIdAndDeviceId(Long userId, String deviceId);

    void flush();

    void save(RefreshTokens refreshTokens);

    void revokeAllByUserId(Long userId);

    void revokeToken(String uuidToken);

    RefreshTokens findById(String uuidToken);

    void upsertRefreshToken(RefreshTokens refreshTokens);

}
