package com.library.circulation.application.reservation;

import com.library.circulation.dto.response.BorrowTransactionResponse;

public interface ConfirmReservationPickupUseCase {
    BorrowTransactionResponse execute(Long reservationId, Long librarianId);
    BorrowTransactionResponse execute(Long reservationId, Long librarianId, String paymentMethod);
    BorrowTransactionResponse execute(Long reservationId, Long librarianId, String paymentMethod, Long depositOrderCode);
}
