package com.library.user.domain.entities;

import com.library.user.domain.valueobject.RoleId;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.AllArgsConstructor;

import java.util.Objects;

@Getter
public class Role {
    private final RoleId id;
    private String roleName;
    private String description;

    private Role(RoleId id, String roleName, String description) {
        this.id = id;

        // 3. Chuẩn hóa dữ liệu ngay khi khởi tạo
        this.roleName = normalizeRoleName(roleName);
        this.description = description != null ? description.trim() : null;
    }

    public static Role of(RoleId id, String roleName, String description) {
        return new Role(id, roleName, description);
    }
    /**
     * Factory method: Tạo role mới
     */
    public static Role create(String roleName, String description) {
        return new Role(RoleId.generate(), roleName, description);
    }

    /**
     * Business logic: Update role details
     */
    public void updateDetails(String roleName, String description) {
        // 4. Bảo vệ các Role hệ thống (Optional - Logic nghiệp vụ)
        if (isSystemRole()) {
            throw new IllegalStateException("Cannot update system role: " + this.roleName);
        }

        this.roleName = normalizeRoleName(roleName);
        this.description = description != null ? description.trim() : null;
    }

    /**
     * Helper: Chuẩn hóa và Validate Role Name
     */
    private String normalizeRoleName(String roleName) {
        if (roleName == null || roleName.trim().isEmpty()) {
            throw new IllegalArgumentException("Role name cannot be null or empty");
        }
        String trimmedName = roleName.trim().toUpperCase(); // Quy ước Role luôn viết hoa

        if (trimmedName.length() > 50) {
            throw new IllegalArgumentException("Role name cannot exceed 50 characters");
        }
        return trimmedName;
    }

    /**
     * Check xem có phải role hệ thống không
     */
    public boolean isSystemRole() {
        return "ADMIN".equals(this.roleName) ||
                "LIBRARIAN".equals(this.roleName) ||
                "STUDENT".equals(this.roleName);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Role that = (Role) o;
        return Objects.equals(id, that.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}