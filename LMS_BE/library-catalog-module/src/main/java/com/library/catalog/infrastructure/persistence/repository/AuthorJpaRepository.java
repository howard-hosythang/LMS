package com.library.catalog.infrastructure.persistence.repository;

import com.library.catalog.infrastructure.persistence.entity.AuthorEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AuthorJpaRepository extends JpaRepository<AuthorEntity, Long> {
    @Query("SELECT a FROM AuthorEntity a WHERE LOWER(a.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<AuthorEntity> searchByName(@Param("keyword") String keyword, Pageable pageable);
}
