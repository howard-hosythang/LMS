package com.library.circulation.domain.valueobject;

import com.library.shared.util.TsIdGenerator;
import lombok.Value;

/**
 * Value Object representing a unique identifier for Reservation.
 */
@Value
public class ReservationId {
    Long value;

    private ReservationId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("ReservationId cannot be null");
        }
        this.value = value;
    }

    public static ReservationId of(Long value) {
        return new ReservationId(value);
    }

    public static ReservationId generate() {
        return new ReservationId(TsIdGenerator.next());
    }
}
