package com.library.circulation.presentation.controller;

import com.library.circulation.application.transaction.BorrowRequestUseCase;
import com.library.circulation.application.transaction.ConfirmPickupUseCase;
import com.library.circulation.application.transaction.DirectBorrowUseCase;
import com.library.circulation.application.transaction.GetAllBorrowingTransactionUseCase;
import com.library.circulation.application.transaction.GetAllTransactionByItemUseCase;
import com.library.circulation.application.transaction.GetMyTransactionsUseCase;
import com.library.circulation.application.transaction.LookupForPickupUseCase;
import com.library.circulation.application.transaction.GetStudentActiveTransactionsUseCase;
import com.library.circulation.application.transaction.LookupActiveTransactionUseCase;
import com.library.circulation.application.transaction.LookupLostBookRecoveryPreviewUseCase;
import com.library.circulation.application.transaction.ReportIssueUseCase;
import com.library.circulation.application.transaction.RestoreLostBookUseCase;
import com.library.circulation.application.transaction.ReturnBookUseCase;
import com.library.circulation.dto.request.BorrowRequestCommand;
import com.library.circulation.dto.request.DirectBorrowCommand;
import com.library.circulation.dto.request.ReportIssueCommand;
import com.library.circulation.dto.request.RestoreLostBookCommand;
import com.library.circulation.dto.request.ReturnCommand;
import com.library.circulation.dto.response.BorrowTransactionResponse;
import com.library.circulation.dto.response.LookupTransactionResponse;
import com.library.circulation.dto.response.LostBookRecoveryPreviewResponse;
import com.library.circulation.dto.response.ActiveTransactionResponse;
import com.library.circulation.dto.response.StudentActiveTransactionsResponse;
import com.library.circulation.dto.response.ReportIssueResponse;
import com.library.circulation.dto.response.RestoreLostBookResponse;
import com.library.circulation.dto.response.ReturnResponse;
import com.library.circulation.dto.response.TransactionListResponse;
import com.library.circulation.dto.response.UserTransactionResponse;
import com.library.shared.constant.RoleConstants;
import com.library.shared.dto.ApiResponseApp;
import com.library.shared.dto.PageResponse;
import com.library.shared.util.RequiresAuthentication;
import com.library.shared.util.RequiresRole;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class BorrowingTransactionController {

  private final GetAllBorrowingTransactionUseCase getAllBorrowingTransactionUseCase;
  private final GetAllTransactionByItemUseCase getAllTransactionByItemUseCase;
  private final GetMyTransactionsUseCase getMyTransactionsUseCase;
  private final BorrowRequestUseCase borrowRequestUseCase;
  private final DirectBorrowUseCase directBorrowUseCase;
  private final ConfirmPickupUseCase confirmPickupUseCase;
  private final LookupForPickupUseCase lookupForPickupUseCase;
  private final GetStudentActiveTransactionsUseCase getStudentActiveTransactionsUseCase;
  private final LookupActiveTransactionUseCase lookupActiveTransactionUseCase;
  private final LookupLostBookRecoveryPreviewUseCase lookupLostBookRecoveryPreviewUseCase;
  private final ReturnBookUseCase returnBookUseCase;
  private final ReportIssueUseCase reportIssueUseCase;
  private final RestoreLostBookUseCase restoreLostBookUseCase;
  private final com.library.shared.util.SecurityEvaluator security;

  @RequiresRole(RoleConstants.LIBRARIAN)
  @GetMapping
  @Operation(summary = "Get all borrowing transactions (librarian)")
  public ApiResponseApp<PageResponse<TransactionListResponse>> getAllTransactions(
      @RequestParam(value = "page", defaultValue = "0") int page,
      @RequestParam(value = "size", defaultValue = "15") int size,
      @RequestParam(value = "keyword", required = false) String keyword,
      @RequestParam(value = "status", required = false) String status,
      @RequestParam(value = "fineStatus", required = false) String fineStatus,
      @RequestParam(value = "dateFrom", required = false) String dateFrom,
      @RequestParam(value = "dateTo", required = false) String dateTo,
      @RequestParam(value = "sortBy", defaultValue = "createdAt") String sortBy,
      @RequestParam(value = "sortDir", defaultValue = "DESC") String sortDir) {
    return ApiResponseApp.success("All transactions",
        getAllBorrowingTransactionUseCase.execute(
            page, size, keyword, status, fineStatus, dateFrom, dateTo, sortBy, sortDir));
  }

  @RequiresRole(RoleConstants.LIBRARIAN)
  @GetMapping("/items/{id}")
  @Operation(summary = "Get transactions by item (librarian)")
  public ApiResponseApp<PageResponse<TransactionListResponse>> getTransactionsByItem(
      @PathVariable("id") Long itemId,
      @RequestParam(value = "page", defaultValue = "0") int page,
      @RequestParam(value = "size", defaultValue = "10") int size) {
    return ApiResponseApp.success("All transactions By ItemId",
        getAllTransactionByItemUseCase.execute(itemId, page, size));
  }

  @GetMapping("/my-transactions")
  @RequiresAuthentication
  @Operation(summary = "Get current user's borrowing transactions")
  public ApiResponseApp<PageResponse<UserTransactionResponse>> getMyTransactions(
      @RequestParam(value = "page", defaultValue = "0") int page,
      @RequestParam(value = "size", defaultValue = "10") int size) {
    Long userId = security.getCurrentUserId();
    return ApiResponseApp.success(getMyTransactionsUseCase.execute(userId, page, size));
  }

  @PostMapping("/borrow")
  @RequiresAuthentication
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Request to borrow an item")
  public ApiResponseApp<BorrowTransactionResponse> borrowItem(
      @Valid @RequestBody BorrowRequestCommand command) {
    Long userId = security.getCurrentUserId();
    return ApiResponseApp.created(borrowRequestUseCase.execute(userId, command));
  }

  @PostMapping("/borrow-direct")
  @RequiresRole(RoleConstants.LIBRARIAN)
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Librarian creates borrow directly at library (studentId + barcode)")
  public ApiResponseApp<BorrowTransactionResponse> borrowDirect(
      @Valid @RequestBody DirectBorrowCommand command) {
    Long librarianId = security.getCurrentUserId();
    return ApiResponseApp.created(directBorrowUseCase.execute(librarianId, command));
  }

  @GetMapping("/lookup")
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "Lookup a WAITING_FOR_PICKUP transaction (by transactionId OR studentId+barcode)")
  public ApiResponseApp<LookupTransactionResponse> lookupTransaction(
      @RequestParam(name = "transactionId", required = false) Long transactionId,
      @RequestParam(name = "studentId", required = false) String studentId,
      @RequestParam(name = "barcode", required = false) String barcode) {
    return ApiResponseApp.success(lookupForPickupUseCase.execute(transactionId, studentId, barcode));
  }

  @PostMapping("/{id}/confirm-pickup")
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "Confirm book handover to user (librarian)")
  public ApiResponseApp<BorrowTransactionResponse> confirmPickup(
      @PathVariable("id") Long transactionId) {
    Long librarianId = security.getCurrentUserId();
    return ApiResponseApp.success(confirmPickupUseCase.execute(transactionId, librarianId));
  }

  @GetMapping("/student-active")
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "Get all active (BORROWING/OVERDUE) transactions of a student by studentId")
  public ApiResponseApp<StudentActiveTransactionsResponse> getStudentActive(
      @RequestParam(name = "studentId") String studentId) {
    return ApiResponseApp.success(getStudentActiveTransactionsUseCase.execute(studentId));
  }

  @GetMapping("/active")
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "Lookup active (BORROWING/OVERDUE) transaction by barcode with borrower info")
  public ApiResponseApp<ActiveTransactionResponse> lookupActive(
      @RequestParam(name = "barcode") String barcode) {
    return ApiResponseApp.success(lookupActiveTransactionUseCase.execute(barcode));
  }

  @PostMapping("/return")
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "Return a borrowed book by barcode (librarian)")
  public ApiResponseApp<ReturnResponse> returnBook(
      @Valid @RequestBody ReturnCommand command) {
    Long librarianId = security.getCurrentUserId();
    return ApiResponseApp.success(returnBookUseCase.execute(librarianId, command));
  }

  @PostMapping("/{id}/report-issue")
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "Report damaged or lost book, optionally with overdue fine (librarian)")
  public ApiResponseApp<ReportIssueResponse> reportIssue(
      @PathVariable("id") Long transactionId,
      @Valid @RequestBody ReportIssueCommand command) {
    Long librarianId = security.getCurrentUserId();
    return ApiResponseApp.success(reportIssueUseCase.execute(transactionId, librarianId, command));
  }

  @GetMapping("/{id}/restore-lost/preview")
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "Preview a lost-book recovery by transaction id (librarian)")
  public ApiResponseApp<LostBookRecoveryPreviewResponse> previewLostBookRecovery(
      @PathVariable("id") Long transactionId) {
    return ApiResponseApp.success(lookupLostBookRecoveryPreviewUseCase.execute(transactionId));
  }

  @PostMapping("/{id}/restore-lost")
  @RequiresRole(RoleConstants.LIBRARIAN)
  @Operation(summary = "Restore a book copy that was reported lost and record any refund (librarian)")
  public ApiResponseApp<RestoreLostBookResponse> restoreLostBook(
      @PathVariable("id") Long transactionId,
      @Valid @RequestBody RestoreLostBookCommand command) {
    Long librarianId = security.getCurrentUserId();
    return ApiResponseApp.success(restoreLostBookUseCase.execute(transactionId, librarianId, command));
  }
}
