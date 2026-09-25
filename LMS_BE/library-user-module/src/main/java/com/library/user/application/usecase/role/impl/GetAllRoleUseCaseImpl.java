package com.library.user.application.usecase.role.impl;

import com.library.user.application.dto.response.RoleResponse;
import com.library.user.application.mapper.RoleMapper;
import com.library.user.application.usecase.role.GetAllRoleUseCase;
import com.library.user.domain.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GetAllRoleUseCaseImpl implements GetAllRoleUseCase {
    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponse> execute() {
        return roleRepository.findAll().stream()
                .map(roleMapper::toRoleResponse)
                .collect(Collectors.toList());
    }
}
