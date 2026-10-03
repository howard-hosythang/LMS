package com.library.circulation.presentation.controller;

import com.library.circulation.application.inquiry.CirculationInquiryService;
import com.library.shared.constant.RoleConstants;
import com.library.shared.dto.ApiResponseApp;
import com.library.shared.util.RequiresRole;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/librarians/inquiry")
public class CirculationInquiryController {
    private final CirculationInquiryService service;

    @GetMapping("/readers") @RequiresRole(RoleConstants.LIBRARIAN)
    public ApiResponseApp<?> readers(@RequestParam(defaultValue = "") String keyword) { return ApiResponseApp.success(service.readers(keyword)); }

    @GetMapping("/publications") @RequiresRole(RoleConstants.LIBRARIAN)
    public ApiResponseApp<?> publications(@RequestParam(defaultValue = "") String keyword, @RequestParam(required = false) String branch) { return ApiResponseApp.success(service.publications(keyword, branch)); }

    @GetMapping("/publications/{id}") @RequiresRole(RoleConstants.LIBRARIAN)
    public ApiResponseApp<?> publication(@PathVariable Long id, @RequestParam(required = false) String branch,
        @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) { return ApiResponseApp.success(service.publication(id, branch, page, size)); }

    @GetMapping("/items/barcode") @RequiresRole(RoleConstants.LIBRARIAN)
    public ApiResponseApp<?> barcode(@RequestParam String barcode) { return ApiResponseApp.success(service.barcode(barcode)); }

    @GetMapping("/items/{id}") @RequiresRole(RoleConstants.LIBRARIAN)
    public ApiResponseApp<?> item(@PathVariable Long id) { return ApiResponseApp.success(service.item(id)); }

    @GetMapping("/items/{id}/timeline") @RequiresRole(RoleConstants.LIBRARIAN)
    public ApiResponseApp<?> timeline(@PathVariable Long id, @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) { return ApiResponseApp.success(service.timeline(id, page, size)); }

    @GetMapping("/transactions/{id}") @RequiresRole(RoleConstants.LIBRARIAN)
    public ApiResponseApp<?> transaction(@PathVariable Long id) { return ApiResponseApp.success(service.transaction(id)); }
}
