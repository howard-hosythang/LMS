package com.library.user.infrastructure.persistence.entity;

import com.library.shared.entity.BaseEntity;
import com.library.user.domain.entities.UserStatus;
import com.library.user.domain.enums.FacultyEnum;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

/**
 * JPA Entity for User table
 * Maps to the database schema defined in the specification
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_email", columnList = "email")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEntity extends BaseEntity {

    @Column(name = "email", unique = true, nullable = false, length = 100)
    private String email;

    private String hashedPassword;

    @Column(nullable = false, length = 100)
    private String fullName;

    private LocalDate dateOfBirth;

    private String address;

    @Column(length = 20)
    private String phoneNumber;

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    @Column(name = "student_id", length = 20)
    private String studentId;

    @Column(name = "librarian_campus", length = 20)
    private String librarianCampus;

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private boolean verified = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserStatus status = UserStatus.INACTIVE;

    @Enumerated(EnumType.STRING)
    private FacultyEnum faculty;

    private LocalDateTime lastLoginAt;

    @Column(name = "account_activated_at")
    private Instant accountActivatedAt;

    private String provider;

    private String providerId;

    @Column(nullable = false)
    @Builder.Default
    private int creditScore = 100;

    @Column(nullable = false)
    @Builder.Default
    private int contributionScore = 0;

    @ManyToMany
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "userId"),
        inverseJoinColumns = @JoinColumn(name = "roleId")
    )
    @Builder.Default
    private Set<RoleEntity> roles = new HashSet<>();
}
