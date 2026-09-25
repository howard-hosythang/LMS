package com.library.user.application.mapper;

import com.library.user.application.dto.response.RoleResponse;
import com.library.user.domain.entities.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface RoleMapper {

    @Mapping(target = "id", source = "id.value")
    RoleResponse toRoleResponse(Role role);
}
