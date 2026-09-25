package com.library.user.infrastructure.persistence.repository;

import com.library.user.infrastructure.persistence.entity.UserEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA Repository for UserJpaEntity
 */
@Repository
public interface UserJpaRepository extends JpaRepository<UserEntity, Long> {
    /**
     * Find the user by email
     */
    Optional<UserEntity> findByEmail(String email);

    /**
     * Check if email exists
     */
    boolean existsByEmail(String email);

    /**
     * Find users by role name
     */
    @Query("SELECT u FROM UserEntity u JOIN u.roles r WHERE r.roleName = :roleName")
    List<UserEntity> findByRoleName(@Param("roleName") String roleName);


    @Query("SELECT u FROM UserEntity u LEFT JOIN FETCH u.roles WHERE u.id = :id")
    Optional<UserEntity> findByIdWithRoles(@Param("id") Long id);

    Optional<UserEntity> findByProviderAndProviderId(String provider, String providerId);
}
