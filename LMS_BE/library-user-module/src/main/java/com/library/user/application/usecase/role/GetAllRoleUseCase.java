package com.library.user.application.usecase.role;

import com.library.user.application.dto.response.RoleResponse;

import java.util.List;

public interface GetAllRoleUseCase {
    List<RoleResponse> execute();
}
