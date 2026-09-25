package com.library.circulation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.library.circulation.domain.enums.ReservationStatus;
import java.time.Instant;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReservationResponse {

    @JsonSerialize(using = ToStringSerializer.class)
    private Long reservationId;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long publicationId;

    private String publicationTitle;
    private String coverImageUrl;
    private String preferredBranch;
    private ReservationStatus status;
    private int queuePosition;

    // Filled when READY_FOR_PICKUP
    @JsonSerialize(using = ToStringSerializer.class)
    private Long assignedItemId;
    private String assignedBarcode;
    private String assignedBranch;
    private String assignedLocation;
    private Instant holdExpirationTime;

    private Instant reservationDate;
}
