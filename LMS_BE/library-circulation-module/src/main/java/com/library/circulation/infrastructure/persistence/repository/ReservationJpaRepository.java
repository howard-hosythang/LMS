package com.library.circulation.infrastructure.persistence.repository;

import com.library.circulation.infrastructure.persistence.entity.ReservationEntity;
import com.library.circulation.domain.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReservationJpaRepository extends JpaRepository<ReservationEntity, Long> {
  long countByPublicationIdAndStatus(Long publicationId, ReservationStatus status);
}
