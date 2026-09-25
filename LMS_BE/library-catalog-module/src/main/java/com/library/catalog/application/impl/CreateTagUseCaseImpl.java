package com.library.catalog.application.impl;

import com.library.catalog.application.CreateTagUseCase;
import com.library.catalog.infrastructure.persistence.entity.TagEntity;
import com.library.catalog.infrastructure.persistence.repository.TagJpaRepository;
import com.library.shared.util.TsIdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CreateTagUseCaseImpl implements CreateTagUseCase {

    private final TagJpaRepository tagJpaRepository;

    @Override
    @Transactional
    public void execute(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Tag name cannot be empty");
        }

        TagEntity entity = new TagEntity();
        entity.setId(TsIdGenerator.next());
        entity.setName(name.replace("\"", ""));

        tagJpaRepository.save(entity);
    }
}
