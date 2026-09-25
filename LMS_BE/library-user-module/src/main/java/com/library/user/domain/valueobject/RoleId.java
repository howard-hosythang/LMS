package com.library.user.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

import java.util.Objects;
import java.util.UUID;

/**
 * Value object representing Role identifier
 */
@Value
public class RoleId {
    Long value;

    private RoleId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("Role ID must be a positive number");
        }
        this.value = value;
    }

    public static RoleId of(Long value) {
        return new RoleId(value);
    }

    public static RoleId generate() {
        return new RoleId(TsIdGenerator.next());
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RoleId roleId = (RoleId) o;
        return Objects.equals(value, roleId.getValue());
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }
}
