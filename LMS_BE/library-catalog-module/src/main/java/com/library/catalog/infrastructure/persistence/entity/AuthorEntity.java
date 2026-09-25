package com.library.catalog.infrastructure.persistence.entity;

import com.library.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "authors", indexes = {
    @Index(name = "idx_author_name", columnList = "authorName")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthorEntity extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private LocalDate dateOfBirth;

    private LocalDate dateOfDeath;
}
