package com.library.catalog.application.impl;

import com.library.catalog.application.SearchAuthorUseCase;
import com.library.catalog.dto.response.author.AuthorOverviewResponse;
import com.library.catalog.infrastructure.persistence.repository.AuthorJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchAuthorUseCaseImpl implements SearchAuthorUseCase {

    private final AuthorJpaRepository authorJpaRepository;

    @Override
    public List<AuthorOverviewResponse> execute(String keyword) {
        return authorJpaRepository.searchByName(keyword, PageRequest.of(0, 10))
                .stream()
                .map(entity -> AuthorOverviewResponse.builder()
                        .id(entity.getId())
                        .name(entity.getName())
                        .build())
                .toList();
    }
}
