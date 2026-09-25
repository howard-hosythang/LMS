package com.library.catalog.presentation.controller;

import com.library.catalog.application.CreatePublisherUseCase;
import com.library.catalog.application.SearchPublisherUseCase;
import com.library.catalog.dto.response.publisher.PublisherOverviewResponse;
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
@RequestMapping("/api/v1/publishers")
@RequiredArgsConstructor
public class PublisherController {

    private final SearchPublisherUseCase searchPublisherUseCase;
    private final CreatePublisherUseCase createPublisherUseCase;

    // limit 10
    @RequiresRole(RoleConstants.LIBRARIAN)
    @GetMapping
    public ApiResponseApp<List<PublisherOverviewResponse>> searchPublisher(@RequestParam("keyword") String keyword) {
        log.info("Search publisher with keyword: {}", keyword);
        return ApiResponseApp.success(searchPublisherUseCase.execute(keyword));
    }


    @PostMapping
    @RequiresRole(RoleConstants.LIBRARIAN)
    public ApiResponseApp<Map<String, Object>> createPublisher(@RequestBody String name) {
        log.info("Create publisher: {}", name);
        Long id = createPublisherUseCase.execute(name);
        return ApiResponseApp.created(Map.of("id", String.valueOf(id), "name", name.replace("\"", "")));
    }

}
