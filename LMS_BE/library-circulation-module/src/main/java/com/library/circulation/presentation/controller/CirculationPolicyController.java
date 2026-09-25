package com.library.circulation.presentation.controller;

import com.library.circulation.application.policy.CirculationPolicy;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.dto.request.UpdateCirculationPolicyRequest;
import com.library.circulation.dto.response.CirculationPolicyResponse;
import com.library.shared.constant.RoleConstants;
import com.library.shared.dto.ApiResponseApp;
import com.library.shared.util.RequiresRole;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/circulation-policies")
@RequiredArgsConstructor
public class CirculationPolicyController {

    private final CirculationPolicyService policyService;
    private final com.library.shared.util.SecurityEvaluator security;

    @GetMapping
    @Operation(summary = "Get backend-enforced circulation policies")
    public ApiResponseApp<CirculationPolicyResponse> getPolicy() {
        return ApiResponseApp.success(toResponse(policyService.getPolicy()));
    }

    @GetMapping("/admin")
    @RequiresRole(RoleConstants.ADMIN)
    @Operation(summary = "Get circulation policies for admin")
    public ApiResponseApp<CirculationPolicyResponse> getPolicyForAdmin() {
        return ApiResponseApp.success(toResponse(policyService.getPolicy()));
    }

    @PutMapping("/admin")
    @RequiresRole(RoleConstants.ADMIN)
    @Operation(summary = "Update backend-enforced circulation policies")
    public ApiResponseApp<CirculationPolicyResponse> updatePolicy(
        @Valid @RequestBody UpdateCirculationPolicyRequest request) {
        return ApiResponseApp.success("Circulation policy updated",
            toResponse(policyService.updatePolicy(request, security.getCurrentUserId())));
    }

    private CirculationPolicyResponse toResponse(CirculationPolicy policy) {
        return CirculationPolicyResponse.builder()
            .pickupDeadlineHours(policy.pickupDeadlineHours())
            .defaultLoanDays(policy.defaultLoanDays())
            .maxActiveBorrows(policy.maxActiveBorrows())
            .maxActiveReservations(policy.maxActiveReservations())
            .overdueFinePerDay(policy.overdueFinePerDay())
            .defaultDepositAmount(policy.defaultDepositAmount())
            .blockBorrowWhenUnpaidFines(policy.blockBorrowWhenUnpaidFines())
            .updatedByAdminId(policy.updatedByAdminId())
            .updatedByAdminName(policy.updatedByAdminName())
            .updatedAt(policy.updatedAt())
            .build();
    }
}
