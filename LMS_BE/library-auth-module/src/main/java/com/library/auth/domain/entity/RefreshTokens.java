package com.library.auth.domain.entity;

import com.library.auth.domain.valueobject.UUIDToken;
import lombok.Getter;

import java.time.Instant;

@Getter
public class RefreshTokens {
    private UUIDToken id;
    private Long userId;

    private boolean revoked;

    private final String deviceId;

    private final Instant expiryDate;

    // dùng khi tạo mới
    public RefreshTokens(UUIDToken id, String deviceId, Long userId, Instant expiryDate) {
        this.id = id;
        this.deviceId = deviceId;
        this.userId = userId;
        this.expiryDate = expiryDate;
        this.revoked = false;
    }

    // dùng khi load từ DB
    public RefreshTokens(UUIDToken id, String deviceId, Long userId,
                         Instant expiryDate, boolean revoked) {
        this.id = id;
        this.deviceId = deviceId;
        this.userId = userId;
        this.expiryDate = expiryDate;
        this.revoked = revoked;
    }

    public boolean isExpiredOrRevoked() {
        return expiryDate.isBefore(Instant.now()) || revoked;
    }
}
