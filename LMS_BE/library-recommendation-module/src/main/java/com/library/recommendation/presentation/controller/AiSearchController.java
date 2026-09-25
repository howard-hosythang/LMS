package com.library.recommendation.presentation.controller;

import com.library.recommendation.infrastructure.ai.AiGatewayService;
import com.library.shared.dto.ApiResponseApp;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiSearchController {

    private final AiGatewayService aiGatewayService;

    @PostMapping("/semantic-search")
    public ApiResponseApp<SemanticSearchResponse> semanticSearch(@RequestBody SemanticSearchRequest request) {
        int limit = request.limit() != null ? request.limit() : 10;
        var result = aiGatewayService.semanticSearch(request.queryText(), limit);
        List<String> publicationIds = result.publicationIds().stream()
            .map(String::valueOf)
            .toList();
        return ApiResponseApp.success(new SemanticSearchResponse(publicationIds));
    }

    public record SemanticSearchRequest(String queryText, Integer limit) {
    }

    public record SemanticSearchResponse(List<String> publicationIds) {
    }
}
