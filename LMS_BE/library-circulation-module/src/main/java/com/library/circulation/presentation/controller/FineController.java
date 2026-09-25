package com.library.circulation.presentation.controller;

import com.library.circulation.application.fine.GetMyFinesUseCase;
import com.library.circulation.application.fine.GetStudentFinesUseCase;
import com.library.circulation.application.fine.FinePaymentService;
import com.library.circulation.application.fine.PayAllFinesUseCase;
import com.library.circulation.application.fine.PayFineUseCase;
import com.library.circulation.dto.response.FinePaymentLinkResponse;
import com.library.circulation.dto.response.FineResponse;
import com.library.circulation.dto.response.StudentFinesResponse;
import com.library.shared.constant.RoleConstants;
import com.library.shared.dto.ApiResponseApp;
import com.library.shared.dto.PageResponse;
import com.library.shared.util.RequiresAuthentication;
import com.library.shared.util.RequiresRole;
import io.swagger.v3.oas.annotations.Operation;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@RestController
@RequestMapping("/api/v1/fines")
@RequiredArgsConstructor
public class FineController {

    private final GetStudentFinesUseCase getStudentFinesUseCase;
    private final GetMyFinesUseCase getMyFinesUseCase;
    private final PayFineUseCase payFineUseCase;
    private final PayAllFinesUseCase payAllFinesUseCase;
    private final FinePaymentService finePaymentService;
    private final com.library.shared.util.SecurityEvaluator security;

    @GetMapping("/student")
    @RequiresRole(RoleConstants.LIBRARIAN)
    @Operation(summary = "Get UNPAID fines of a student by studentId (librarian)")
    public ApiResponseApp<StudentFinesResponse> getStudentFines(
        @RequestParam(name = "studentId") String studentId) {
        return ApiResponseApp.success(getStudentFinesUseCase.execute(studentId));
    }

    @PutMapping("/{id}/pay")
    @RequiresRole(RoleConstants.LIBRARIAN)
    @Operation(summary = "Mark a fine as paid (librarian)")
    public ApiResponseApp<FineResponse> payFine(
        @PathVariable("id") Long fineId) {
        return ApiResponseApp.success(payFineUseCase.execute(fineId, security.getCurrentUserId()));
    }

    @PutMapping("/pay-all")
    @RequiresRole(RoleConstants.LIBRARIAN)
    @Operation(summary = "Mark all UNPAID fines of a student as paid (librarian)")
    public ApiResponseApp<Map<String, Integer>> payAllFines(
        @RequestParam(name = "studentId") String studentId) {
        int count = payAllFinesUseCase.execute(studentId, security.getCurrentUserId());
        return ApiResponseApp.success(Map.of("paidCount", count));
    }

    @PostMapping("/payments/cash")
    @RequiresRole(RoleConstants.LIBRARIAN)
    @Operation(summary = "Mark all UNPAID fines of a student as paid by cash (librarian)")
    public ApiResponseApp<Map<String, Integer>> payAllFinesByCash(
        @RequestParam(name = "studentId") String studentId) {
        int count = payAllFinesUseCase.execute(studentId, security.getCurrentUserId());
        return ApiResponseApp.success("Cash payment recorded", Map.of("paidCount", count));
    }

    @PostMapping("/payments/payos")
    @RequiresRole(RoleConstants.LIBRARIAN)
    @Operation(summary = "Create payOS QR payment link for all UNPAID fines of a student")
    public ApiResponseApp<FinePaymentLinkResponse> createPayOsFinePayment(
        @RequestParam(name = "studentId") String studentId) {
        return ApiResponseApp.success("payOS payment link created",
            finePaymentService.createPayOsPaymentLink(studentId, security.getCurrentUserId()));
    }

    @PostMapping("/payments/payos/{orderCode}/sync")
    @RequiresRole(RoleConstants.LIBRARIAN)
    @Operation(summary = "Sync payOS payment status for a fine payment order")
    public ApiResponseApp<Map<String, Integer>> syncPayOsFinePayment(
        @PathVariable("orderCode") Long orderCode) {
        int paidCount = finePaymentService.syncPayOsPayment(orderCode, security.getCurrentUserId());
        return ApiResponseApp.success(Map.of("paidCount", paidCount));
    }

    @PostMapping("/payments/payos/webhook")
    @Operation(summary = "payOS webhook for fine payment confirmation")
    public ApiResponseApp<Map<String, Integer>> handlePayOsFineWebhook(@RequestBody String rawBody) {
        try {
            int paidCount = finePaymentService.confirmPayOsWebhook(rawBody);
            return ApiResponseApp.success(Map.of("paidCount", paidCount));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid payOS webhook");
        }
    }

    @GetMapping("/my-fines")
    @RequiresAuthentication
    @Operation(summary = "Get current user's fines with status filter (student)")
    public ApiResponseApp<PageResponse<FineResponse>> getMyFines(
        @RequestParam(name = "status", required = false) String status,
        @RequestParam(name = "page", defaultValue = "0") int page,
        @RequestParam(name = "size", defaultValue = "10") int size) {
        Long userId = security.getCurrentUserId();
        return ApiResponseApp.success(getMyFinesUseCase.execute(userId, status, page, size));
    }
}
