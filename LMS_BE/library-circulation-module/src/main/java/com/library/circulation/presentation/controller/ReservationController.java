package com.library.circulation.presentation.controller;

import com.library.circulation.application.reservation.CancelReservationUseCase;
import com.library.circulation.application.reservation.CreateReservationUseCase;
import com.library.circulation.application.reservation.GetMyReservationsUseCase;
import com.library.circulation.dto.request.CreateReservationCommand;
import com.library.circulation.dto.response.ReservationResponse;
import com.library.shared.constant.RoleConstants;
import com.library.shared.dto.ApiResponseApp;
import com.library.shared.dto.PageResponse;
import com.library.shared.util.RequiresAuthentication;
import com.library.shared.util.RequiresRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
public class ReservationController {

  private final CreateReservationUseCase createReservationUseCase;
  private final CancelReservationUseCase cancelReservationUseCase;
  private final GetMyReservationsUseCase getMyReservationsUseCase;
  private final com.library.circulation.application.reservation.ConfirmReservationPickupUseCase confirmReservationPickupUseCase;
  private final com.library.circulation.application.reservation.LookupReservationForPickupUseCase lookupReservationForPickupUseCase;
  private final com.library.shared.util.SecurityEvaluator security;

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @RequiresAuthentication
  public ApiResponseApp<ReservationResponse> createReservation(
      @RequestBody CreateReservationCommand command) {
    Long userId = security.getCurrentUserId();
    return ApiResponseApp.created(createReservationUseCase.execute(userId, command));
  }

  @GetMapping("/lookup")
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<com.library.circulation.dto.response.LookupReservationResponse> lookupReservation(
      @RequestParam(value = "reservationId", required = false) Long reservationId,
      @RequestParam(value = "studentId", required = false) String studentId,
      @RequestParam(value = "barcode", required = false) String barcode) {
    return ApiResponseApp.success(
        lookupReservationForPickupUseCase.execute(reservationId, studentId, barcode));
  }

  @PostMapping("/{id}/confirm-pickup")
  @RequiresRole(RoleConstants.LIBRARIAN)
  public ApiResponseApp<com.library.circulation.dto.response.BorrowTransactionResponse> confirmPickup(
      @PathVariable("id") Long reservationId) {
    Long librarianId = security.getCurrentUserId();
    return ApiResponseApp.success(
        confirmReservationPickupUseCase.execute(reservationId, librarianId));
  }

  @DeleteMapping("/{id}")
  @RequiresAuthentication
  public ApiResponseApp<Void> cancelReservation(@PathVariable("id") Long reservationId) {
    Long userId = security.getCurrentUserId();
    cancelReservationUseCase.execute(userId, reservationId);
    return ApiResponseApp.success(null);
  }

  @GetMapping("/my-reservations")
  @RequiresAuthentication
  public ApiResponseApp<PageResponse<ReservationResponse>> getMyReservations(
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "10") int size) {
    Long userId = security.getCurrentUserId();
    Page<ReservationResponse> result = getMyReservationsUseCase.execute(
        userId, PageRequest.of(page, size));
    return ApiResponseApp.success(PageResponse.from(result));
  }
}
