package com.library.recommendation.application.searchhistory;

import com.library.recommendation.dto.SearchHistoryItem;
import java.util.List;

public interface GetSearchHistoryUseCase {
    List<SearchHistoryItem> execute(Long userId, String keyword);
}
