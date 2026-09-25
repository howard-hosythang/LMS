package com.library.catalog.presentation.controller;

import com.library.catalog.application.CreateAuthorUseCase;
import com.library.catalog.application.SearchAuthorUseCase;
import com.library.catalog.dto.response.author.AuthorOverviewResponse;
import com.library.shared.constant.RoleConstants;
import com.library.shared.dto.ApiResponseApp;
import com.library.shared.util.RequiresRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/authors")
@RequiredArgsConstructor
public class AuthorController {

    private final SearchAuthorUseCase searchAuthorUseCase;
    private final CreateAuthorUseCase createAuthorUseCase;

    // limit 10
    @RequiresRole(RoleConstants.LIBRARIAN)
    @GetMapping
    public ApiResponseApp<List<AuthorOverviewResponse>> searchAuthor(@RequestParam("keyword") String keyword) {
        log.info("Search author with keyword: {}", keyword);
        return ApiResponseApp.success(searchAuthorUseCase.execute(keyword));
    }

    @PostMapping
    @RequiresRole(RoleConstants.LIBRARIAN)
    public ApiResponseApp<Map<String, Object>> createAuthor(@RequestBody String name) {
        log.info("Create author: {}", name);
        Long id = createAuthorUseCase.execute(name);
        return ApiResponseApp.created(Map.of("id", String.valueOf(id), "name", name.replace("\"", "")));
    }
}
