package com.library.recommendation.application.searchhistory;

public interface SaveSearchHistoryUseCase {
    void execute(Long userId, String keyword);
}
