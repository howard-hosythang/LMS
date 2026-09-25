package com.library.user.application.dto.request;

import jakarta.validation.constraints.NotNull;

/**
 * DTO for assigning role to user
 */
public record AssignRoleRequest (
    @NotNull(message = "User ID is required")
    Long userId,

    @NotNull(message = "Role ID is required")
    Long roleId
){}
