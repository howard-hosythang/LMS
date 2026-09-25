package com.library.user.domain.repository;

import com.library.user.domain.entities.Role;
import com.library.user.domain.valueobject.RoleId;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Role Aggregate
 * Follows Repository pattern from DDD
 */
public interface RoleRepository {

    /**
     * Save a role (insert or update)
     */
    Role save(Role role);

    /**
     * Find a role by ID
     */
    Optional<Role> findById(RoleId roleId);

    /**
     * Find a role by name
     */
    Optional<Role> findByName(String roleName);

    /**
     * Check if a role exists by name
     */
    boolean existsByName(String roleName);

    /**
     * Delete a role
     */
    void delete(Role role);

    /**
     * Delete role by ID
     */
    void deleteById(RoleId roleId);

    List<Role> findAll();
}
