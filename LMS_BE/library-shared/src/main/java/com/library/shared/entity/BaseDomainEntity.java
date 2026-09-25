package com.library.shared.entity;

import java.time.Instant;

public abstract class BaseDomainEntity {
    private Instant createdAt;
    private Instant updatedAt;
    private Long createdBy;
    private Long updatedBy;
}
