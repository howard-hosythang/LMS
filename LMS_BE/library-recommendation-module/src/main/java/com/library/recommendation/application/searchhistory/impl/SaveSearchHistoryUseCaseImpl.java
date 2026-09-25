package com.library.recommendation.application.searchhistory.impl;

import com.library.recommendation.application.searchhistory.SaveSearchHistoryUseCase;
import com.library.recommendation.infrastructure.persistence.repository.SearchHistoryJpaRepository;
import com.library.user.infrastructure.persistence.entity.SearchHistoryEntity;
import com.library.shared.util.TsIdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SaveSearchHistoryUseCaseImpl implements SaveSearchHistoryUseCase {

    private static final int MAX_HISTORY = 10;
    private final SearchHistoryJpaRepository repository;

    @Override
    @Transactional
    public void execute(Long userId, String keyword) {
        String kw = keyword.trim();
        if (kw.isBlank()) return;

        // Upsert: nếu đã tồn tại thì cập nhật updated_at
        repository.findByUserIdAndSearchQuery(userId, kw).ifPresentOrElse(
            existing -> repository.save(existing),
            () -> {
                if (repository.countByUserId(userId) >= MAX_HISTORY) {
                    repository.findOldestByUserId(userId).ifPresent(repository::delete);
                }
                SearchHistoryEntity entity = SearchHistoryEntity.builder()
                    .userId(userId)
                    .searchQuery(kw)
                    .build();
                entity.setId(TsIdGenerator.next());
                repository.save(entity);
            }
        );
    }
}
