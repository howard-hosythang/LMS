package com.library.catalog.application.impl;

import com.library.catalog.application.CreateAuthorUseCase;
import com.library.catalog.infrastructure.persistence.entity.AuthorEntity;
import com.library.catalog.infrastructure.persistence.repository.AuthorJpaRepository;
import com.library.shared.util.TsIdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CreateAuthorUseCaseImpl implements CreateAuthorUseCase {

    private final AuthorJpaRepository authorJpaRepository;

    @Override
    @Transactional
    public Long execute(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Author name cannot be empty");
        }
        AuthorEntity entity = new AuthorEntity();
        entity.setId(TsIdGenerator.next());
        entity.setName(name.replace("\"", ""));
        authorJpaRepository.save(entity);
        return entity.getId();
    }
}
