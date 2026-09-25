package com.library.user.application.usecase.role.impl;

import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.user.application.dto.request.CreateRoleRequest;
import com.library.user.application.dto.response.RoleResponse;
import com.library.user.application.mapper.RoleMapper;
import com.library.user.application.usecase.role.CreateRoleUseCase;
import com.library.user.domain.entities.Role;
import com.library.user.domain.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CreateRoleUseCaseImpl implements CreateRoleUseCase {
    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;

    @Override
    @Transactional
    public RoleResponse execute(CreateRoleRequest request) {
        if (roleRepository.existsByName(request.roleName().trim()))
            throw new AppException(ErrorCode.ROLE_ALREADY_EXISTS);
        Role role = Role.create(request.roleName(), request.description());
        Role savedRole = roleRepository.save(role);
        return roleMapper.toRoleResponse(savedRole);
    }
}
