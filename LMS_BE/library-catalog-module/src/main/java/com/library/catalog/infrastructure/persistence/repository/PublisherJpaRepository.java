package com.library.catalog.infrastructure.persistence.repository;

import com.library.catalog.infrastructure.persistence.entity.PublisherEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PublisherJpaRepository extends JpaRepository<PublisherEntity, Long> {
    @Query("SELECT p FROM PublisherEntity p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<PublisherEntity> searchByName(@Param("keyword") String keyword, Pageable pageable);
}
