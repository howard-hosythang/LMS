package com.library.auth.infrastructure.persistence.mapper;

import com.library.auth.domain.valueobject.UUIDToken;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ObjectFactory;

@Mapper(componentModel = "spring")
public interface RefreshTokensEntityMapper {

    com.library.auth.domain.entity.RefreshTokens toDomain(com.library.auth.infrastructure.persistence.entity.RefreshTokensEntity refreshTokens);

    @Mapping(target = "uuidToken", source = "id")
    com.library.auth.infrastructure.persistence.entity.RefreshTokensEntity toEntity(com.library.auth.domain.entity.RefreshTokens refreshTokens);

    @ObjectFactory
    default com.library.auth.domain.entity.RefreshTokens create(com.library.auth.infrastructure.persistence.entity.RefreshTokensEntity entity) {
        return new com.library.auth.domain.entity.RefreshTokens(
                UUIDToken.of(entity.getUuidToken()),
                entity.getDeviceId(),
                entity.getUserId(),
                entity.getExpiryDate(),
                entity.isRevoked()
        );
    }


    default UUIDToken map(String value) {
        return value == null ? null : UUIDToken.of(value);
    }

    default String map(UUIDToken value) {
        return value == null ? null : value.getValue();
    }
}
