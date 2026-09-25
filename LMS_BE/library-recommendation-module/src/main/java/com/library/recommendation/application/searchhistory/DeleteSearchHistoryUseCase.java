package com.library.recommendation.application.searchhistory;

public interface DeleteSearchHistoryUseCase {
    void execute(Long userId, Long historyId);
}
