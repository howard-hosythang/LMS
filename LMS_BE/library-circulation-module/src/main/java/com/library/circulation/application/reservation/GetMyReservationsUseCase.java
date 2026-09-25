package com.library.circulation.application.reservation;

import com.library.circulation.dto.response.ReservationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GetMyReservationsUseCase {
    Page<ReservationResponse> execute(Long userId, Pageable pageable);
}
