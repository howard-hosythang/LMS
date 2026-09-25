package com.library.catalog.infrastructure.persistence.entity;

import com.library.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "publishers", indexes = {
    @Index(name = "idx_publisher_name", columnList = "name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PublisherEntity extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column
    private String address;
}
