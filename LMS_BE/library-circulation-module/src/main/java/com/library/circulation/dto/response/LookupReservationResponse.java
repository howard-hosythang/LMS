package com.library.circulation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.library.circulation.domain.enums.ReservationStatus;
import java.time.Instant;
import lombok.Builder;

@Builder
public record LookupReservationResponse(
    @JsonSerialize(using = ToStringSerializer.class) Long reservationId,
    @JsonSerialize(using = ToStringSerializer.class) Long userId,
    String studentId,
    String fullName,
    @JsonSerialize(using = ToStringSerializer.class) Long itemId,
    String barcode,
    @JsonSerialize(using = ToStringSerializer.class) Long publicationId,
    String publicationTitle,
    String branch,
    String location,
    Instant holdExpirationTime,
    ReservationStatus status
) {}
