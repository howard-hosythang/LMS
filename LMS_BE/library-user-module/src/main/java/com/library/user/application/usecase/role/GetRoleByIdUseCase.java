package com.library.user.application.usecase.role;

import com.library.user.application.dto.response.RoleResponse;
import com.library.user.application.dto.response.UserResponse;

/**
 * Use a case for getting a role by ID
 */
public interface GetRoleByIdUseCase {

    /**
     * Execute the use case to get a role by ID
     *
     * @param roleId the role ID
     * @return the role response
     */
    RoleResponse execute(Long roleId);
}
