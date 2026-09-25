package com.library.user.infrastructure.persistence.repository.impl;

import com.library.user.domain.entities.Role;
import com.library.user.domain.repository.RoleRepository;
import com.library.user.domain.valueobject.RoleId;
import com.library.user.infrastructure.persistence.mapper.UserEntityMapper;
import com.library.user.infrastructure.persistence.entity.RoleEntity;
import com.library.user.infrastructure.persistence.repository.RoleJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Implementation of RoleRepository
 * Adapts Spring Data JPA repository to Domain repository interface
 */
@Repository
@RequiredArgsConstructor
public class RoleRepositoryImpl implements RoleRepository {

    private final RoleJpaRepository roleJpaRepository;
    private final UserEntityMapper entityMapper;

    @Override
    public Role save(Role role) {
        RoleEntity entity = entityMapper.toEntity(role);
        RoleEntity savedEntity = roleJpaRepository.save(entity);
        return entityMapper.toDomainModel(savedEntity);
    }

    @Override
    public Optional<Role> findById(RoleId roleId) {
        return roleJpaRepository.findById(roleId.getValue())
            .map(entityMapper::toDomainModel);
    }

    @Override
    public Optional<Role> findByName(String roleName) {
        return roleJpaRepository.findByRoleName(roleName)
            .map(entityMapper::toDomainModel);
    }

    @Override
    public boolean existsByName(String roleName) {
        return roleJpaRepository.existsByRoleName(roleName);
    }

    @Override
    public void delete(Role role) {
        roleJpaRepository.deleteById(role.getId().getValue());
    }

    @Override
    public void deleteById(RoleId roleId) {
        roleJpaRepository.deleteById(roleId.getValue());
    }

    @Override
    public List<Role> findAll() {
        return roleJpaRepository.findAll().stream()
                .map(entityMapper::toDomainModel)
                .collect(Collectors.toList());
    }
}
