package com.library.circulation.presentation.controller;

import com.library.circulation.application.deposit.DepositPaymentService;
import com.library.circulation.dto.request.DepositPaymentRequest;
import com.library.circulation.dto.response.DepositPaymentResponse;
import com.library.shared.constant.RoleConstants;
import com.library.shared.dto.ApiResponseApp;
import com.library.shared.util.RequiresRole;
import com.library.shared.util.SecurityEvaluator;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/deposits/payments/payos")
@RequiredArgsConstructor
public class DepositPaymentController {
    private final DepositPaymentService service;
    private final SecurityEvaluator security;

    @PostMapping
    @RequiresRole(RoleConstants.LIBRARIAN)
    public ApiResponseApp<DepositPaymentResponse> create(@Valid @RequestBody DepositPaymentRequest request) {
        return ApiResponseApp.success(service.create(request, security.getCurrentUserId()));
    }

    @PostMapping("/{orderCode}/sync")
    @RequiresRole(RoleConstants.LIBRARIAN)
    public ApiResponseApp<DepositPaymentResponse> sync(@PathVariable("orderCode") Long code) {
        return ApiResponseApp.success(service.sync(code, security.getCurrentUserId()));
    }

    @PostMapping("/{orderCode}/cancel")
    @RequiresRole(RoleConstants.LIBRARIAN)
    public ApiResponseApp<DepositPaymentResponse> cancel(@PathVariable("orderCode") Long code) {
        return ApiResponseApp.success(service.cancel(code, security.getCurrentUserId()));
    }
}
