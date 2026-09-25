package com.library.circulation.infrastructure.persistence.repository;

import com.library.circulation.infrastructure.persistence.entity.FineEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FineJpaRepository extends JpaRepository<FineEntity, Long> {
}
