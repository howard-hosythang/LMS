package com.library.catalog.presentation.controller;

import com.library.catalog.application.CreateTagUseCase;
import com.library.catalog.application.SearchTagUseCase;
import com.library.catalog.dto.response.tag.TagResponse;
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


@Slf4j
@RestController
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
public class TagController {

    private final SearchTagUseCase searchTagUseCase;
    private final CreateTagUseCase createTagUseCase;

    // limit 10
    @RequiresRole(RoleConstants.LIBRARIAN)
    @GetMapping
    public ApiResponseApp<List<TagResponse>> searchTags(@RequestParam("keyword") String keyword) {
        log.info("Search tags with keyword: {}", keyword);
        return ApiResponseApp.success(searchTagUseCase.execute(keyword));
    }


    @PostMapping
    @RequiresRole(RoleConstants.LIBRARIAN)
    public ApiResponseApp<Void> createTag(@RequestBody String name) {
        log.info("Create tag: {}", name);
        createTagUseCase.execute(name);
        return ApiResponseApp.success("create tag success");
    }
}
