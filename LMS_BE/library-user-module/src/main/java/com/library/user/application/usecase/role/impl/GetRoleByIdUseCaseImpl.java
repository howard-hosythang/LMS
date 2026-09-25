package com.library.user.application.usecase.role.impl;

import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.user.application.dto.response.RoleResponse;
import com.library.user.application.mapper.RoleMapper;
import com.library.user.application.usecase.role.GetRoleByIdUseCase;
import com.library.user.domain.entities.Role;
import com.library.user.domain.repository.RoleRepository;
import com.library.user.domain.valueobject.RoleId;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementation of GetRoleByIdUseCase
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GetRoleByIdUseCaseImpl implements GetRoleByIdUseCase {

    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;


    @Override
    @Transactional(readOnly = true)
    public RoleResponse execute(Long roleId) {
        log.info("Getting role with ID: {}", roleId);

        RoleId id = RoleId.of(roleId);
        Role role = roleRepository.findById(id).orElseThrow(
                () -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        return roleMapper.toRoleResponse(role);
    }
}
