package com.library.catalog.application.impl;

import com.library.catalog.application.SearchPublisherUseCase;
import com.library.catalog.dto.response.publisher.PublisherOverviewResponse;
import com.library.catalog.infrastructure.persistence.repository.PublisherJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchPublisherUseCaseImpl implements SearchPublisherUseCase {

    private final PublisherJpaRepository publisherJpaRepository;

    @Override
    public List<PublisherOverviewResponse> execute(String keyword) {
        return publisherJpaRepository.searchByName(keyword, PageRequest.of(0, 10))
                .stream()
                .map(entity -> PublisherOverviewResponse.builder()
                        .id(entity.getId())
                        .name(entity.getName())
                        .build())
                .toList();
    }
}
