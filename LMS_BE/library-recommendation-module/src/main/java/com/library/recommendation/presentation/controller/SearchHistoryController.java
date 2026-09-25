package com.library.recommendation.presentation.controller;

import com.library.recommendation.application.searchhistory.DeleteSearchHistoryUseCase;
import com.library.recommendation.application.searchhistory.GetSearchHistoryUseCase;
import com.library.recommendation.application.searchhistory.SaveSearchHistoryUseCase;
import com.library.shared.dto.ApiResponseApp;
import com.library.shared.util.RequiresAuthentication;
import com.library.shared.util.SecurityEvaluator;
import com.library.recommendation.dto.SearchHistoryItem;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/search-history")
@RequiredArgsConstructor
public class SearchHistoryController {

    private final SecurityEvaluator security;
    private final GetSearchHistoryUseCase getSearchHistoryUseCase;
    private final SaveSearchHistoryUseCase saveSearchHistoryUseCase;
    private final DeleteSearchHistoryUseCase deleteSearchHistoryUseCase;

    @GetMapping
    @RequiresAuthentication
    public ApiResponseApp<List<SearchHistoryItem>> getHistory(
        @RequestParam(name = "keyword", required = false) String keyword) {
        return ApiResponseApp.success(getSearchHistoryUseCase.execute(security.getCurrentUserId(), keyword));
    }

    @PostMapping
    @RequiresAuthentication
    public ApiResponseApp<Void> saveHistory(@RequestBody KeywordRequest request) {
        saveSearchHistoryUseCase.execute(security.getCurrentUserId(), request.keyword());
        return ApiResponseApp.success("Saved");
    }

    @DeleteMapping("/{id}")
    @RequiresAuthentication
    public ApiResponseApp<Void> deleteHistory(@PathVariable("id") Long id) {
        deleteSearchHistoryUseCase.execute(security.getCurrentUserId(), id);
        return ApiResponseApp.deleteSuccess();
    }

    record KeywordRequest(String keyword) {}
}
