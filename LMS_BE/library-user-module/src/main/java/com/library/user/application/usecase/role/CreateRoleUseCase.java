package com.library.user.application.usecase.role;

import com.library.user.application.dto.request.CreateRoleRequest;
import com.library.user.application.dto.response.RoleResponse;

public interface CreateRoleUseCase {
    RoleResponse execute(CreateRoleRequest request);
}
