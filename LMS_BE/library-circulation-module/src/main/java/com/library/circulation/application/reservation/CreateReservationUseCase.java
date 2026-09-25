package com.library.circulation.application.reservation;

import com.library.circulation.dto.request.CreateReservationCommand;
import com.library.circulation.dto.response.ReservationResponse;

public interface CreateReservationUseCase {
    ReservationResponse execute(Long userId, CreateReservationCommand command);
}
