package com.library.auth.infrastructure.persistence.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens", uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "deviceId"}))
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RefreshTokensEntity {
    @Id
    private String uuidToken;

    private Long userId;

    @Builder.Default
    private boolean revoked = false;

    private String deviceId;

    private Instant expiryDate;

    public boolean isExpiredOrRevoked() {
        return expiryDate.isBefore(Instant.now()) || revoked;
    }

    public RefreshTokensEntity(String uuidToken) {
        this.uuidToken = uuidToken;
    }
}
