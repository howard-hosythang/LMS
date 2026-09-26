package com.library.user.presentation.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.shared.constant.RoleConstants;
import com.library.shared.util.RequiresRole;
import com.library.shared.util.TsIdGenerator;
import com.library.user.application.dto.request.AdminUpdateUserRequest;
import com.library.user.application.dto.request.CreateManagedUserRequest;
import com.library.user.domain.entities.UserStatus;
import com.library.user.domain.enums.FacultyEnum;
import com.library.user.infrastructure.persistence.entity.RoleEntity;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminManagementController {

    private static final Set<String> ADMIN_MANAGED_ROLES = Set.of(
        RoleConstants.STUDENT,
        RoleConstants.LIBRARIAN
    );

    private final com.library.user.infrastructure.persistence.repository.UserJpaRepository userRepository;
    private final com.library.user.infrastructure.persistence.repository.RoleJpaRepository roleRepository;
    private final com.library.user.application.port.PasswordHasher passwordHasher;
    private final com.library.shared.util.SecurityEvaluator security;
    private final com.library.shared.service.AuditLogService auditLogService;
    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final com.library.shared.port.StoragePort storagePort;

    @GetMapping("/librarians")
    @RequiresRole(RoleConstants.ADMIN)
    @Operation(summary = "List librarian accounts")
    public com.library.shared.dto.ApiResponseApp<List<com.library.user.application.dto.response.LibrarianAccountResponse>> listLibrarians() {
        return com.library.shared.dto.ApiResponseApp.success(userRepository.findByRoleName(RoleConstants.LIBRARIAN)
            .stream()
            .map(this::toLibrarianResponse)
            .toList());
    }

    @PostMapping("/librarians")
    @RequiresRole(RoleConstants.ADMIN)
    @Operation(summary = "Create a librarian account")
    public com.library.shared.dto.ApiResponseApp<com.library.user.application.dto.response.LibrarianAccountResponse> createLibrarian(
        @Valid @RequestBody com.library.user.application.dto.request.CreateLibrarianRequest request) {
        return createLibrarianAccount(
            request.email(),
            request.fullName(),
            request.password(),
            request.librarianCode(),
            request.librarianCampus(),
            request.phoneNumber(),
            request.address(),
            request.profilePictureUrl(),
            null
        );
    }

    @PostMapping(value = "/librarians", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequiresRole(RoleConstants.ADMIN)
    @Operation(summary = "Create a librarian account with uploaded avatar")
    public com.library.shared.dto.ApiResponseApp<com.library.user.application.dto.response.LibrarianAccountResponse> createLibrarianWithAvatar(
        @RequestParam("email") String email,
        @RequestParam("fullName") String fullName,
        @RequestParam("password") String password,
        @RequestParam(value = "librarianCode", required = false) String librarianCode,
        @RequestParam("librarianCampus") String librarianCampus,
        @RequestParam("phoneNumber") String phoneNumber,
        @RequestParam("address") String address,
        @RequestParam("avatar") MultipartFile avatar) {
        return createLibrarianAccount(email, fullName, password, librarianCode, librarianCampus, phoneNumber, address, null, avatar);
    }

    private com.library.shared.dto.ApiResponseApp<com.library.user.application.dto.response.LibrarianAccountResponse> createLibrarianAccount(
        String rawEmail,
        String rawFullName,
        String rawPassword,
        String rawLibrarianCode,
        String rawLibrarianCampus,
        String rawPhoneNumber,
        String rawAddress,
        String rawProfilePictureUrl,
        MultipartFile avatar
    ) {
        requireText(rawEmail, "Email is required");
        requireText(rawFullName, "Full name is required");
        requireText(rawPassword, "Password is required");
        requireText(rawLibrarianCampus, "Librarian campus is required");
        requireText(rawPhoneNumber, "Phone number is required");
        requireText(rawAddress, "Address is required");
        if (avatar == null) {
            requireText(rawProfilePictureUrl, "Profile picture is required");
        } else if (avatar.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Avatar file is required");
        }

        String email = rawEmail.trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }
        String phoneNumber = normalizePhoneNumber(rawPhoneNumber);
        ensureUniquePhoneNumber(phoneNumber, null);
        String librarianCode = generateNextLibrarianCode();
        ensureUniqueIdentityCode(librarianCode, null);
        String librarianCampus = normalizeLibrarianCampus(rawLibrarianCampus);
        Integer duplicateCode = jdbcTemplate.queryForObject(
            """
            SELECT COUNT(*)
            FROM users u
            JOIN user_roles ur ON ur.user_id = u.id
            JOIN roles r ON r.id = ur.role_id
            WHERE r.role_name = :role AND u.student_id = :code
            """,
            new MapSqlParameterSource()
                .addValue("role", RoleConstants.LIBRARIAN)
                .addValue("code", librarianCode),
            Integer.class
        );
        if (duplicateCode != null && duplicateCode > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Librarian code already exists");
        }
        RoleEntity librarianRole = roleRepository.findByRoleName(RoleConstants.LIBRARIAN)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "LIBRARIAN role not found"));

        com.library.user.infrastructure.persistence.entity.UserEntity user = com.library.user.infrastructure.persistence.entity.UserEntity.builder()
            .email(email)
            .fullName(rawFullName.trim())
            .phoneNumber(phoneNumber)
            .studentId(librarianCode)
            .librarianCampus(librarianCampus)
            .address(rawAddress.trim())
            .profilePictureUrl(rawProfilePictureUrl == null ? null : rawProfilePictureUrl.trim())
            .hashedPassword(passwordHasher.hash(rawPassword))
            .status(UserStatus.ACTIVE)
            .accountActivatedAt(Instant.now())
            .creditScore(100)
            .contributionScore(0)
            .build();
        user.setId(TsIdGenerator.next());
        if (avatar != null) {
            user.setProfilePictureUrl(storagePort.upload(avatar, "avatars/" + user.getId()));
        }
        user.getRoles().add(librarianRole);
        com.library.user.infrastructure.persistence.entity.UserEntity saved = userRepository.save(user);

        Long adminId = security.getCurrentUserId();
        auditLogService.log(
            adminId,
            RoleConstants.ADMIN,
            "CREATE_LIBRARIAN",
            "users",
            saved.getId(),
            "Admin created librarian account " + saved.getEmail(),
            Map.of("email", saved.getEmail(), "fullName", saved.getFullName(), "librarianCode", librarianCode, "librarianCampus", librarianCampus)
        );
        return com.library.shared.dto.ApiResponseApp.created("Librarian account created", toLibrarianResponse(saved));
    }

    private String generateNextLibrarianCode() {
        Integer maxNumber = jdbcTemplate.queryForObject(
            """
            SELECT COALESCE(MAX(CAST(SUBSTRING(student_id FROM 4) AS integer)), 0)
            FROM users
            WHERE student_id ~ '^LIB[0-9]+$'
            """,
            new MapSqlParameterSource(),
            Integer.class
        );
        int next = (maxNumber == null ? 0 : maxNumber) + 1;
        while (true) {
            String candidate = String.format("LIB%04d", next);
            Integer exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE student_id = :code",
                new MapSqlParameterSource().addValue("code", candidate),
                Integer.class
            );
            if (exists == null || exists == 0) {
                return candidate;
            }
            next++;
        }
    }

    @GetMapping("/users")
    @RequiresRole(RoleConstants.ADMIN)
    @Operation(summary = "List user accounts for admin management")
    public com.library.shared.dto.ApiResponseApp<List<com.library.user.application.dto.response.AdminUserAccountResponse>> listUsers(
        @RequestParam(name = "role", defaultValue = RoleConstants.STUDENT) String role,
        @RequestParam(name = "status", required = false) String status,
        @RequestParam(name = "keyword", required = false) String keyword) {
        String safeRole = normalizeRole(role);
        String safeStatus = normalizeOptionalStatus(status);
        String safeKeyword = keyword == null || keyword.isBlank() ? null : "%" + keyword.trim().toLowerCase() + "%";

        StringBuilder sql = new StringBuilder("""
            SELECT u.id, u.email, u.full_name, u.phone_number, u.student_id, u.librarian_campus, u.faculty,
                   u.address, u.profile_picture_url, u.status, u.is_verified, u.created_at, u.account_activated_at, u.last_login_at,
                   COALESCE(string_agg(DISTINCT r.role_name, ',' ORDER BY r.role_name), '') AS roles
            FROM users u
            JOIN user_roles ur_filter ON ur_filter.user_id = u.id
            JOIN roles r_filter ON r_filter.id = ur_filter.role_id AND r_filter.role_name = :role
            JOIN user_roles ur ON ur.user_id = u.id
            JOIN roles r ON r.id = ur.role_id
            WHERE 1 = 1
            """);
        MapSqlParameterSource params = new MapSqlParameterSource()
            .addValue("role", safeRole);
        if (safeStatus != null) {
            sql.append(" AND u.status = :status\n");
            params.addValue("status", safeStatus);
        }
        if (safeKeyword != null) {
            sql.append("""
                AND (
                  LOWER(u.full_name) LIKE :keyword
                  OR LOWER(u.email) LIKE :keyword
                  OR LOWER(COALESCE(u.student_id, '')) LIKE :keyword
                  OR LOWER(COALESCE(u.phone_number, '')) LIKE :keyword
                )
                """);
            params.addValue("keyword", safeKeyword);
        }
        sql.append("""
            GROUP BY u.id, u.email, u.full_name, u.phone_number, u.student_id, u.librarian_campus, u.faculty,
                     u.address, u.profile_picture_url, u.status, u.is_verified, u.created_at, u.account_activated_at, u.last_login_at
            ORDER BY u.created_at DESC NULLS LAST, u.id DESC
            """);

        return com.library.shared.dto.ApiResponseApp.success(jdbcTemplate.query(
            sql.toString(),
            params,
            (rs, rowNum) -> com.library.user.application.dto.response.AdminUserAccountResponse.builder()
                .id(rs.getLong("id"))
                .email(rs.getString("email"))
                .fullName(rs.getString("full_name"))
                .phoneNumber(rs.getString("phone_number"))
                .studentId(rs.getString("student_id"))
                .librarianCampus(rs.getString("librarian_campus"))
                .faculty(rs.getString("faculty"))
                .address(rs.getString("address"))
                .profilePictureUrl(rs.getString("profile_picture_url"))
                .status(rs.getString("status"))
                .verified(rs.getBoolean("is_verified"))
                .roles(splitRoles(rs.getString("roles")))
                .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toInstant() : null)
                .accountActivatedAt(rs.getTimestamp("account_activated_at") != null ? rs.getTimestamp("account_activated_at").toInstant() : null)
                .lastLoginAt(rs.getTimestamp("last_login_at") != null ? rs.getTimestamp("last_login_at").toLocalDateTime() : null)
                .build()
        ));
    }

    @PostMapping("/users")
    @RequiresRole(RoleConstants.ADMIN)
    @Operation(summary = "Create a student account without email verification")
    public com.library.shared.dto.ApiResponseApp<com.library.user.application.dto.response.AdminUserAccountResponse> createManagedUser(
        @Valid @RequestBody CreateManagedUserRequest request) {
        return createManagedUserAccount(
            request.fullName(),
            request.studentId(),
            request.email(),
            request.password(),
            request.confirmPassword(),
            request.faculty(),
            request.phoneNumber(),
            request.address(),
            request.profilePictureUrl(),
            null
        );
    }

    @PostMapping(value = "/users", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequiresRole(RoleConstants.ADMIN)
    @Operation(summary = "Create a student account with uploaded avatar and without email verification")
    public com.library.shared.dto.ApiResponseApp<com.library.user.application.dto.response.AdminUserAccountResponse> createManagedUserWithAvatar(
        @RequestParam("fullName") String fullName,
        @RequestParam("studentId") String studentId,
        @RequestParam("email") String email,
        @RequestParam("password") String password,
        @RequestParam("confirmPassword") String confirmPassword,
        @RequestParam("faculty") String faculty,
        @RequestParam(value = "phoneNumber", required = false) String phoneNumber,
        @RequestParam(value = "address", required = false) String address,
        @RequestParam("avatar") MultipartFile avatar) {
        return createManagedUserAccount(fullName, studentId, email, password, confirmPassword, faculty, phoneNumber, address, null, avatar);
    }

    private com.library.shared.dto.ApiResponseApp<com.library.user.application.dto.response.AdminUserAccountResponse> createManagedUserAccount(
        String rawFullName,
        String rawStudentId,
        String rawEmail,
        String rawPassword,
        String rawConfirmPassword,
        String rawFaculty,
        String rawPhoneNumber,
        String rawAddress,
        String rawProfilePictureUrl,
        MultipartFile avatar
    ) {
        String fullName = requiredTrim(rawFullName, "Full name is required");
        String studentId = requiredTrim(rawStudentId, "Student ID is required");
        String email = requiredTrim(rawEmail, "Email is required").toLowerCase();
        String password = requiredTrim(rawPassword, "Password is required");
        String confirmPassword = requiredTrim(rawConfirmPassword, "Confirm password is required");
        if (!password.equals(confirmPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password confirmation does not match");
        }
        if (!studentId.matches("\\d{7}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student ID must be 7 digits");
        }
        FacultyEnum faculty;
        try {
            faculty = FacultyEnum.valueOf(requiredTrim(rawFaculty, "Faculty is required"));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid faculty");
        }
        if (avatar != null && avatar.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Avatar file is required");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }
        ensureUniqueIdentityCode(studentId, null);
        String phoneNumber = normalizeOptionalPhoneNumber(rawPhoneNumber);
        ensureUniquePhoneNumber(phoneNumber, null);
        Integer duplicateStudentId = jdbcTemplate.queryForObject(
            """
            SELECT COUNT(*)
            FROM users u
            JOIN user_roles ur ON ur.user_id = u.id
            JOIN roles r ON r.id = ur.role_id
            WHERE r.role_name = :role
              AND u.student_id = :studentId
            """,
            new MapSqlParameterSource()
                .addValue("role", RoleConstants.STUDENT)
                .addValue("studentId", studentId),
            Integer.class
        );
        if (duplicateStudentId != null && duplicateStudentId > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Student ID already exists");
        }
        RoleEntity studentRole = roleRepository.findByRoleName(RoleConstants.STUDENT)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "STUDENT role not found"));

        com.library.user.infrastructure.persistence.entity.UserEntity user = com.library.user.infrastructure.persistence.entity.UserEntity.builder()
            .email(email)
            .fullName(fullName)
            .studentId(studentId)
            .faculty(faculty)
            .phoneNumber(phoneNumber)
            .address(trimToNull(rawAddress))
            .profilePictureUrl(trimToNull(rawProfilePictureUrl))
            .hashedPassword(passwordHasher.hash(password))
            .status(UserStatus.ACTIVE)
            .verified(true)
            .accountActivatedAt(Instant.now())
            .creditScore(100)
            .contributionScore(0)
            .build();
        user.setId(TsIdGenerator.next());
        if (avatar != null) {
            user.setProfilePictureUrl(storagePort.upload(avatar, "avatars/" + user.getId()));
        }
        user.getRoles().add(studentRole);
        com.library.user.infrastructure.persistence.entity.UserEntity saved = userRepository.save(user);

        Long adminId = security.getCurrentUserId();
        auditLogService.log(
            adminId,
            RoleConstants.ADMIN,
            "CREATE_USER",
            "users",
            saved.getId(),
            "Admin created user account " + saved.getEmail(),
            Map.of("email", saved.getEmail(), "fullName", saved.getFullName(), "studentId", studentId, "faculty", faculty.name())
        );

        return com.library.shared.dto.ApiResponseApp.created("User account created", findAdminUserResponse(saved.getId()));
    }

    @PostMapping(value = "/users/{userId}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequiresRole(RoleConstants.ADMIN)
    @Operation(summary = "Upload avatar for a managed student or librarian account")
    public com.library.shared.dto.ApiResponseApp<com.library.user.application.dto.response.AdminUserAccountResponse> uploadManagedUserAvatar(
        @PathVariable("userId") Long userId,
        @RequestParam("avatar") MultipartFile avatar) {
        if (avatar == null || avatar.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Avatar file is required");
        }
        com.library.user.infrastructure.persistence.entity.UserEntity user = userRepository.findByIdWithRoles(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        boolean isManagedAccount = user.getRoles().stream()
            .anyMatch(role -> ADMIN_MANAGED_ROLES.contains(role.getRoleName()));
        if (!isManagedAccount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only student and librarian accounts can be updated here");
        }

        String avatarUrl = storagePort.upload(avatar, "avatars/" + user.getId());
        user.setProfilePictureUrl(avatarUrl);
        com.library.user.infrastructure.persistence.entity.UserEntity saved = userRepository.save(user);

        Long adminId = security.getCurrentUserId();
        auditLogService.log(
            adminId,
            RoleConstants.ADMIN,
            "UPLOAD_USER_AVATAR",
            "users",
            saved.getId(),
            "Admin uploaded avatar for " + saved.getEmail(),
            Map.of("email", saved.getEmail(), "roles", saved.getRoles().stream().map(RoleEntity::getRoleName).sorted().toList())
        );

        return com.library.shared.dto.ApiResponseApp.success("Account avatar updated", findAdminUserResponse(saved.getId()));
    }

    @PatchMapping("/users/{userId}/status")
    @RequiresRole(RoleConstants.ADMIN)
    @Operation(summary = "Update account status")
    public com.library.shared.dto.ApiResponseApp<com.library.user.application.dto.response.AdminUserAccountResponse> updateUserStatus(
        @PathVariable("userId") Long userId,
        @Valid @RequestBody com.library.user.application.dto.request.UpdateUserStatusRequest request) {
        UserStatus newStatus = parseStatus(request.status());
        com.library.user.infrastructure.persistence.entity.UserEntity user = userRepository.findByIdWithRoles(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        boolean isManagedAccount = user.getRoles().stream()
            .anyMatch(role -> ADMIN_MANAGED_ROLES.contains(role.getRoleName()));
        if (!isManagedAccount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin system account status cannot be changed here");
        }

        UserStatus oldStatus = user.getStatus();
        user.setStatus(newStatus);
        if (newStatus == UserStatus.ACTIVE && oldStatus != UserStatus.ACTIVE) {
            user.setAccountActivatedAt(Instant.now());
        }
        com.library.user.infrastructure.persistence.entity.UserEntity saved = userRepository.save(user);

        Long adminId = security.getCurrentUserId();
        auditLogService.log(
            adminId,
            RoleConstants.ADMIN,
            "UPDATE_USER_STATUS",
            "users",
            saved.getId(),
            "Admin changed account status for " + saved.getEmail() + " from " + oldStatus + " to " + newStatus,
            Map.of(
                "email", saved.getEmail(),
                "oldStatus", oldStatus.name(),
                "newStatus", newStatus.name(),
                "roles", saved.getRoles().stream().map(RoleEntity::getRoleName).sorted().toList()
            )
        );

        return com.library.shared.dto.ApiResponseApp.success("Account status updated", findAdminUserResponse(saved.getId()));
    }

    @org.springframework.web.bind.annotation.PutMapping("/users/{userId}")
    @RequiresRole(RoleConstants.ADMIN)
    @Operation(summary = "Update managed student or librarian profile")
    public com.library.shared.dto.ApiResponseApp<com.library.user.application.dto.response.AdminUserAccountResponse> updateManagedUser(
        @PathVariable("userId") Long userId,
        @RequestBody AdminUpdateUserRequest request) {
        com.library.user.infrastructure.persistence.entity.UserEntity user = userRepository.findByIdWithRoles(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        List<String> roles = user.getRoles().stream().map(RoleEntity::getRoleName).sorted().toList();
        boolean isStudent = roles.contains(RoleConstants.STUDENT);
        boolean isLibrarian = roles.contains(RoleConstants.LIBRARIAN);
        if (!isStudent && !isLibrarian) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only student and librarian accounts can be updated here");
        }

        String email = requiredTrim(request.email(), "Email is required").toLowerCase();
        String fullName = requiredTrim(request.fullName(), "Full name is required");
        String code;
        if (isLibrarian) {
            code = user.getStudentId();
            if (code == null || code.isBlank()) {
                code = generateNextLibrarianCode();
            }
            String requestedCode = trimToNull(request.studentId());
            if (requestedCode != null && !requestedCode.equals(code)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Librarian code is immutable");
            }
        } else {
            code = requiredTrim(request.studentId(), "Student ID is required");
        }
        String phoneNumber = trimToNull(request.phoneNumber());
        phoneNumber = normalizeOptionalPhoneNumber(phoneNumber);
        String librarianCampus = isLibrarian ? normalizeLibrarianCampus(request.librarianCampus()) : null;
        String address = trimToNull(request.address());
        String avatarUrl = trimToNull(request.profilePictureUrl());

        Integer duplicateEmail = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM users WHERE LOWER(email) = :email AND id <> :id",
            new MapSqlParameterSource().addValue("email", email).addValue("id", userId),
            Integer.class
        );
        if (duplicateEmail != null && duplicateEmail > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        if (!isLibrarian) {
            ensureUniqueIdentityCode(code, userId);
            Integer duplicateCode = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM users u
                JOIN user_roles ur ON ur.user_id = u.id
                JOIN roles r ON r.id = ur.role_id
                WHERE r.role_name = :role
                  AND u.student_id = :code
                  AND u.id <> :id
                """,
                new MapSqlParameterSource()
                    .addValue("role", RoleConstants.STUDENT)
                    .addValue("code", code)
                    .addValue("id", userId),
                Integer.class
            );
            if (duplicateCode != null && duplicateCode > 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Student ID already exists");
            }
        } else {
            ensureUniqueIdentityCode(code, userId);
        }
        ensureUniquePhoneNumber(phoneNumber, userId);

        FacultyEnum faculty = null;
        if (isStudent) {
            String rawFaculty = requiredTrim(request.faculty(), "Faculty is required for student accounts");
            try {
                faculty = FacultyEnum.valueOf(rawFaculty);
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid faculty");
            }
        }

        Map<String, Object> oldValues = Map.of(
            "email", user.getEmail(),
            "fullName", user.getFullName(),
            "code", user.getStudentId() == null ? "" : user.getStudentId()
        );

        user.setEmail(email);
        user.setFullName(fullName);
        user.setStudentId(code);
        user.setLibrarianCampus(librarianCampus);
        user.setPhoneNumber(phoneNumber);
        user.setAddress(address);
        if (avatarUrl != null) {
            user.setProfilePictureUrl(avatarUrl);
        }
        user.setFaculty(faculty);
        com.library.user.infrastructure.persistence.entity.UserEntity saved = userRepository.save(user);

        Long adminId = security.getCurrentUserId();
        auditLogService.log(
            adminId,
            RoleConstants.ADMIN,
            "UPDATE_USER_PROFILE",
            "users",
            saved.getId(),
            "Admin updated profile for " + saved.getEmail(),
            Map.of(
                "old", oldValues,
                "newEmail", saved.getEmail(),
                "newFullName", saved.getFullName(),
                "newCode", saved.getStudentId(),
                "roles", roles
            )
        );

        return com.library.shared.dto.ApiResponseApp.success("Account profile updated", findAdminUserResponse(saved.getId()));
    }

    @PatchMapping("/users/{userId}/verify")
    @RequiresRole(RoleConstants.ADMIN)
    @Operation(summary = "Verify a complete student or librarian account")
    public com.library.shared.dto.ApiResponseApp<com.library.user.application.dto.response.AdminUserAccountResponse> verifyUser(@PathVariable("userId") Long userId) {
        com.library.user.infrastructure.persistence.entity.UserEntity user = userRepository.findByIdWithRoles(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        boolean isManagedAccount = user.getRoles().stream()
            .anyMatch(role -> ADMIN_MANAGED_ROLES.contains(role.getRoleName()));
        if (!isManagedAccount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only student and librarian accounts can be verified here");
        }
        if (!hasCompleteProfile(user)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Account profile is not complete enough to verify");
        }

        user.setVerified(true);
        com.library.user.infrastructure.persistence.entity.UserEntity saved = userRepository.save(user);

        Long adminId = security.getCurrentUserId();
        auditLogService.log(
            adminId,
            RoleConstants.ADMIN,
            "VERIFY_ACCOUNT",
            "users",
            saved.getId(),
            "Admin verified account " + saved.getEmail(),
            Map.of(
                "email", saved.getEmail(),
                "roles", saved.getRoles().stream().map(RoleEntity::getRoleName).sorted().toList()
            )
        );

        return com.library.shared.dto.ApiResponseApp.success("Account verified", findAdminUserResponse(saved.getId()));
    }

    @GetMapping("/audit-logs")
    @RequiresRole(RoleConstants.ADMIN)
    @Operation(summary = "List recent audit logs")
    public com.library.shared.dto.ApiResponseApp<List<com.library.user.application.dto.response.AuditLogResponse>> listAuditLogs(
        @RequestParam(name = "limit", defaultValue = "100") int limit,
        @RequestParam(name = "keyword", required = false) String keyword,
        @RequestParam(name = "actorRole", required = false) String actorRole,
        @RequestParam(name = "action", required = false) String action,
        @RequestParam(name = "entityType", required = false) String entityType,
        @RequestParam(name = "sortBy", defaultValue = "createdAt") String sortBy,
        @RequestParam(name = "sortDir", defaultValue = "DESC") String sortDir) {
        int safeLimit = Math.max(1, Math.min(limit, 500));
        StringBuilder sql = new StringBuilder("""
            SELECT al.id, al.created_at, al.actor_user_id, u.full_name AS actor_name,
                   al.actor_role, al.action, al.entity_type, al.entity_id, al.summary, al.details
            FROM audit_logs al
            LEFT JOIN users u ON u.id = al.actor_user_id
            WHERE 1 = 1
            """);
        MapSqlParameterSource params = new MapSqlParameterSource()
            .addValue("limit", safeLimit);

        if (keyword != null && !keyword.isBlank()) {
            sql.append("""
                AND (
                  LOWER(COALESCE(u.full_name, '')) LIKE :keyword
                  OR LOWER(COALESCE(al.actor_role, '')) LIKE :keyword
                  OR LOWER(COALESCE(al.action, '')) LIKE :keyword
                  OR LOWER(COALESCE(al.entity_type, '')) LIKE :keyword
                  OR LOWER(COALESCE(al.entity_id, '')) LIKE :keyword
                  OR LOWER(COALESCE(al.summary, '')) LIKE :keyword
                )
                """);
            params.addValue("keyword", "%" + keyword.trim().toLowerCase() + "%");
        }
        if (actorRole != null && !actorRole.isBlank() && !"ALL".equalsIgnoreCase(actorRole)) {
            sql.append(" AND al.actor_role = :actorRole\n");
            params.addValue("actorRole", actorRole.trim().toUpperCase());
        }
        if (action != null && !action.isBlank() && !"ALL".equalsIgnoreCase(action)) {
            sql.append(" AND al.action ILIKE :action\n");
            params.addValue("action", "%" + action.trim() + "%");
        }
        if (entityType != null && !entityType.isBlank() && !"ALL".equalsIgnoreCase(entityType)) {
            sql.append(" AND al.entity_type = :entityType\n");
            params.addValue("entityType", entityType.trim());
        }

        sql.append(" ORDER BY ")
            .append(resolveAuditSortColumn(sortBy))
            .append(" ")
            .append("ASC".equalsIgnoreCase(sortDir) ? "ASC" : "DESC")
            .append(" LIMIT :limit");

        return com.library.shared.dto.ApiResponseApp.success(jdbcTemplate.query(
            sql.toString(),
            params,
            (rs, rowNum) -> com.library.user.application.dto.response.AuditLogResponse.builder()
                .id(rs.getLong("id"))
                .createdAt(rs.getTimestamp("created_at").toInstant())
                .actorUserId(rs.getObject("actor_user_id") != null ? rs.getLong("actor_user_id") : null)
                .actorName(rs.getString("actor_name"))
                .actorRole(rs.getString("actor_role"))
                .action(rs.getString("action"))
                .entityType(rs.getString("entity_type"))
                .entityId(rs.getString("entity_id"))
                .summary(rs.getString("summary"))
                .details(toJsonNode(rs.getString("details")))
                .build()
        ));
    }

    private String resolveAuditSortColumn(String sortBy) {
        return switch (sortBy == null ? "" : sortBy) {
            case "actorRole" -> "al.actor_role";
            case "action" -> "al.action";
            case "entityType" -> "al.entity_type";
            default -> "al.created_at";
        };
    }

    private com.library.user.application.dto.response.LibrarianAccountResponse toLibrarianResponse(com.library.user.infrastructure.persistence.entity.UserEntity user) {
        return com.library.user.application.dto.response.LibrarianAccountResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .phoneNumber(user.getPhoneNumber())
            .librarianCode(user.getStudentId())
            .librarianCampus(user.getLibrarianCampus())
            .address(user.getAddress())
            .profilePictureUrl(user.getProfilePictureUrl())
            .status(user.getStatus().name())
            .verified(user.isVerified())
            .createdAt(user.getCreatedAt())
            .accountActivatedAt(user.getAccountActivatedAt())
            .lastLoginAt(user.getLastLoginAt())
            .build();
    }

    private com.library.user.application.dto.response.AdminUserAccountResponse findAdminUserResponse(Long userId) {
        String sql = """
            SELECT u.id, u.email, u.full_name, u.phone_number, u.student_id, u.librarian_campus, u.faculty,
                   u.address, u.profile_picture_url, u.status, u.is_verified, u.created_at, u.account_activated_at, u.last_login_at,
                   COALESCE(string_agg(DISTINCT r.role_name, ',' ORDER BY r.role_name), '') AS roles
            FROM users u
            JOIN user_roles ur ON ur.user_id = u.id
            JOIN roles r ON r.id = ur.role_id
            WHERE u.id = :userId
            GROUP BY u.id, u.email, u.full_name, u.phone_number, u.student_id, u.librarian_campus, u.faculty,
                     u.address, u.profile_picture_url, u.status, u.is_verified, u.created_at, u.account_activated_at, u.last_login_at
            """;
        try {
            return jdbcTemplate.queryForObject(
                sql,
                Map.of("userId", userId),
                (rs, rowNum) -> com.library.user.application.dto.response.AdminUserAccountResponse.builder()
                    .id(rs.getLong("id"))
                    .email(rs.getString("email"))
                    .fullName(rs.getString("full_name"))
                    .phoneNumber(rs.getString("phone_number"))
                    .studentId(rs.getString("student_id"))
                    .librarianCampus(rs.getString("librarian_campus"))
                    .faculty(rs.getString("faculty"))
                    .address(rs.getString("address"))
                    .profilePictureUrl(rs.getString("profile_picture_url"))
                    .status(rs.getString("status"))
                    .verified(rs.getBoolean("is_verified"))
                    .roles(splitRoles(rs.getString("roles")))
                    .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toInstant() : null)
                    .accountActivatedAt(rs.getTimestamp("account_activated_at") != null ? rs.getTimestamp("account_activated_at").toInstant() : null)
                    .lastLoginAt(rs.getTimestamp("last_login_at") != null ? rs.getTimestamp("last_login_at").toLocalDateTime() : null)
                    .build()
            );
        } catch (EmptyResultDataAccessException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
    }

    private String normalizeRole(String role) {
        String normalized = role == null ? RoleConstants.STUDENT : role.trim().toUpperCase();
        if (!ADMIN_MANAGED_ROLES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be STUDENT or LIBRARIAN");
        }
        return normalized;
    }

    private String normalizeOptionalStatus(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status.trim())) {
            return null;
        }
        return parseStatus(status).name();
    }

    private UserStatus parseStatus(String status) {
        try {
            return UserStatus.valueOf(status.trim().toUpperCase());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid account status");
        }
    }

    private List<String> splitRoles(String roles) {
        if (roles == null || roles.isBlank()) {
            return List.of();
        }
        return Arrays.stream(roles.split(","))
            .map(String::trim)
            .filter(role -> !role.isBlank())
            .toList();
    }

    private boolean hasCompleteProfile(com.library.user.infrastructure.persistence.entity.UserEntity user) {
        return hasText(user.getFullName())
            && hasText(user.getEmail())
            && hasText(user.getPhoneNumber())
            && hasText(user.getAddress())
            && hasText(user.getProfilePictureUrl())
            && hasText(user.getStudentId());
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private void requireText(String value, String message) {
        if (!hasText(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private String requiredTrim(String value, String message) {
        requireText(value, message);
        return value.trim();
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String normalizePhoneNumber(String value) {
        String normalized = requiredTrim(value, "Phone number is required").replaceAll("\\s+", "");
        if (!normalized.matches("^[+]?\\d{10,15}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone number must be valid");
        }
        return normalized;
    }

    private String normalizeOptionalPhoneNumber(String value) {
        String trimmed = trimToNull(value);
        return trimmed == null ? null : normalizePhoneNumber(trimmed);
    }

    private void ensureUniquePhoneNumber(String phoneNumber, Long currentUserId) {
        if (phoneNumber == null) {
            return;
        }
        String sql = currentUserId == null
            ? """
              SELECT COUNT(*)
              FROM users
              WHERE NULLIF(BTRIM(phone_number), '') IS NOT NULL
                AND phone_number = :phoneNumber
              """
            : """
              SELECT COUNT(*)
              FROM users
              WHERE NULLIF(BTRIM(phone_number), '') IS NOT NULL
                AND phone_number = :phoneNumber
                AND id <> :currentUserId
              """;
        MapSqlParameterSource params = new MapSqlParameterSource()
            .addValue("phoneNumber", phoneNumber);
        if (currentUserId != null) {
            params.addValue("currentUserId", currentUserId);
        }
        Integer duplicates = jdbcTemplate.queryForObject(
            sql,
            params,
            Integer.class
        );
        if (duplicates != null && duplicates > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone number already exists");
        }
    }

    private void ensureUniqueIdentityCode(String code, Long currentUserId) {
        String normalizedCode = trimToNull(code);
        if (normalizedCode == null) {
            return;
        }
        String sql = currentUserId == null
            ? """
              SELECT COUNT(*)
              FROM users
              WHERE NULLIF(BTRIM(student_id), '') IS NOT NULL
                AND student_id = :code
              """
            : """
              SELECT COUNT(*)
              FROM users
              WHERE NULLIF(BTRIM(student_id), '') IS NOT NULL
                AND student_id = :code
                AND id <> :currentUserId
              """;
        MapSqlParameterSource params = new MapSqlParameterSource()
            .addValue("code", normalizedCode);
        if (currentUserId != null) {
            params.addValue("currentUserId", currentUserId);
        }
        Integer duplicates = jdbcTemplate.queryForObject(
            sql,
            params,
            Integer.class
        );
        if (duplicates != null && duplicates > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Student/librarian code already exists");
        }
    }

    private String normalizeLibrarianCampus(String value) {
        String normalized = requiredTrim(value, "Librarian campus is required").toUpperCase();
        if (!Set.of("CAMPUS_1", "CAMPUS_2", "ALL").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Librarian campus must be CAMPUS_1, CAMPUS_2 or ALL");
        }
        return normalized;
    }

    private JsonNode toJsonNode(String rawJson) {
        if (rawJson == null || rawJson.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readTree(rawJson);
        } catch (Exception e) {
            return null;
        }
    }
}
