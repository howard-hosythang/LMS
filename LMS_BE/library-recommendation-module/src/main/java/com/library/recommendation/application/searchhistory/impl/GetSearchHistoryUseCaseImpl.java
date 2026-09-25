package com.library.recommendation.application.searchhistory.impl;

import com.library.recommendation.application.searchhistory.GetSearchHistoryUseCase;
import com.library.recommendation.dto.SearchHistoryItem;
import com.library.recommendation.infrastructure.persistence.repository.SearchHistoryJpaRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetSearchHistoryUseCaseImpl implements GetSearchHistoryUseCase {

    private final SearchHistoryJpaRepository repository;

    @Override
    public List<SearchHistoryItem> execute(Long userId, String keyword) {
        var entities = (keyword != null && !keyword.isBlank())
            ? repository.findByUserIdAndKeywordContaining(userId, keyword.trim())
            : repository.findRecentByUserId(userId);
        return entities.stream()
            .map(e -> new SearchHistoryItem(e.getId(), e.getSearchQuery()))
            .toList();
    }
}
