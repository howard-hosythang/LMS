package com.library.catalog.application.impl;

import com.library.catalog.application.CreatePublisherUseCase;
import com.library.catalog.infrastructure.persistence.entity.PublisherEntity;
import com.library.catalog.infrastructure.persistence.repository.PublisherJpaRepository;
import com.library.shared.util.TsIdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CreatePublisherUseCaseImpl implements CreatePublisherUseCase {

    private final PublisherJpaRepository publisherJpaRepository;

    @Override
    @Transactional
    public Long execute(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Publisher name cannot be empty");
        }
        PublisherEntity entity = new PublisherEntity();
        entity.setId(TsIdGenerator.next());
        entity.setName(name.replace("\"", ""));
        publisherJpaRepository.save(entity);
        return entity.getId();
    }
}
