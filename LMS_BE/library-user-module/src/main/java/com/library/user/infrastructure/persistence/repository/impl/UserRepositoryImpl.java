package com.library.user.infrastructure.persistence.repository.impl;

import com.library.user.domain.entities.User;
import com.library.user.domain.repository.UserRepository;
import com.library.user.domain.valueobject.Email;
import com.library.user.domain.valueobject.UserId;
import com.library.user.infrastructure.persistence.mapper.UserEntityMapper;
import com.library.user.infrastructure.persistence.entity.UserEntity;
import com.library.user.infrastructure.persistence.repository.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Implementation of UserRepositoryInterface
 * Adapts Spring Data JPA repository to Domain repository interface
 */
@Repository
@RequiredArgsConstructor
public class UserRepositoryImpl implements UserRepository {

    private final UserJpaRepository userJpaRepository;
    private final UserEntityMapper entityMapper;

    @Override
    public User save(User user) {
        UserEntity entity = entityMapper.toEntity(user);
        UserEntity savedEntity = userJpaRepository.save(entity);
        return entityMapper.toDomainModel(savedEntity);
    }

    @Override
    public Optional<User> findById(UserId userId) {
        return userJpaRepository.findById(userId.getValue())
            .map(entityMapper::toDomainModel);
    }

    @Override
    public Optional<User> findByEmail(Email email) {
        return userJpaRepository.findByEmail(email.getValue())
            .map(entityMapper::toDomainModel);
    }

    @Override
    public List<User> findAll() {
        return userJpaRepository.findAll().stream()
            .map(entityMapper::toDomainModel)
            .collect(Collectors.toList());
    }

    @Override
    public List<User> findByRoleName(String roleName) {
        return userJpaRepository.findByRoleName(roleName).stream()
            .map(entityMapper::toDomainModel)
            .collect(Collectors.toList());
    }

    @Override
    public boolean existsByEmail(Email email) {
        return userJpaRepository.existsByEmail(email.getValue());
    }

    @Override
    public void delete(User user) {
        userJpaRepository.deleteById(user.getId().getValue());
    }

    @Override
    public void deleteById(UserId userId) {
        userJpaRepository.deleteById(userId.getValue());
    }

    @Override
    public long count() {
        return userJpaRepository.count();
    }

    @Override
    public Optional<User> findByProviderAndProviderId(String provider, String providerId) {
        return userJpaRepository.findByProviderAndProviderId(provider, providerId)
                .map(entityMapper::toDomainModel);
    }
}
