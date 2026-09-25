package com.library.circulation.application.reservation;

import com.library.circulation.dto.response.LookupReservationResponse;

public interface LookupReservationForPickupUseCase {
    LookupReservationResponse execute(Long reservationId, String studentId, String barcode);
}
