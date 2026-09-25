package com.library.circulation.application.reservation;

public interface CancelReservationUseCase {
    void execute(Long userId, Long reservationId);
}
