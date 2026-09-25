package com.library.recommendation.application.searchhistory.impl;

import com.library.recommendation.application.searchhistory.DeleteSearchHistoryUseCase;
import com.library.recommendation.infrastructure.persistence.repository.SearchHistoryJpaRepository;
import com.library.user.infrastructure.persistence.entity.SearchHistoryEntity;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DeleteSearchHistoryUseCaseImpl implements DeleteSearchHistoryUseCase {

    private final SearchHistoryJpaRepository repository;

    @Override
    @Transactional
    public void execute(Long userId, Long historyId) {
        SearchHistoryEntity entity = repository.findById(historyId)
            .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST));
        if (!entity.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        repository.delete(entity);
    }
}
