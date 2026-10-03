package com.library.circulation.presentation.controller;

import com.library.circulation.application.reshelving.ReshelvingService;
import com.library.circulation.dto.response.ReshelvingItemResponse;
import com.library.shared.constant.RoleConstants;
import com.library.shared.dto.ApiResponseApp;
import com.library.shared.util.RequiresRole;
import com.library.shared.util.SecurityEvaluator;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/librarians/reshelving")
public class ReshelvingController {
    private final ReshelvingService service;
    private final SecurityEvaluator security;

    @GetMapping
    @RequiresRole(RoleConstants.LIBRARIAN)
    public ApiResponseApp<List<ReshelvingItemResponse>> getWaiting(@RequestParam(required = false) String branch) {
        return ApiResponseApp.success(service.getWaiting(branch));
    }

    @GetMapping("/count")
    @RequiresRole(RoleConstants.LIBRARIAN)
    public ApiResponseApp<Map<String, Long>> count(@RequestParam(required = false) String branch) {
        return ApiResponseApp.success(Map.of("count", service.countWaiting(branch)));
    }

    @GetMapping("/default-branch")
    @RequiresRole(RoleConstants.LIBRARIAN)
    public ApiResponseApp<Map<String, String>> defaultBranch() {
        return ApiResponseApp.success(Map.of("branch", service.getDefaultBranch(security.getCurrentUserId())));
    }

    @PostMapping("/confirm")
    @RequiresRole(RoleConstants.LIBRARIAN)
    public ApiResponseApp<Map<String, Integer>> confirm(@Valid @RequestBody ConfirmRequest request) {
        return ApiResponseApp.success(service.confirm(request.taskIds(), security.getCurrentUserId(), request.branch()));
    }

    public record ConfirmRequest(@NotEmpty @Size(max = 10000) List<@NotNull @Positive Long> taskIds,
        @NotEmpty String branch) {}
}
