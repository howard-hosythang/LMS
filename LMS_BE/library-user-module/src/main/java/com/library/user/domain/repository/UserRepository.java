package com.library.user.domain.repository;

import com.library.user.domain.entities.User;
import com.library.user.domain.valueobject.Email;
import com.library.user.domain.valueobject.UserId;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for User Aggregate Root
 * Follows Repository pattern from DDD
 */
public interface UserRepository {
    User save(User user);
    Optional<User> findById(UserId userId);
    Optional<User> findByEmail(Email email);
    List<User> findAll();
    List<User> findByRoleName(String roleName);
    boolean existsByEmail(Email email);
    void delete(User user);
    void deleteById(UserId userId);
    long count();
    Optional<User> findByProviderAndProviderId(String provider, String providerId);
}
