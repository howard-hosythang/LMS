package com.library.circulation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.math.BigDecimal;
import lombok.Builder;

@Builder
public record RestoreLostBookResponse(
    @JsonSerialize(using = ToStringSerializer.class)
    Long recoveryId,

    @JsonSerialize(using = ToStringSerializer.class)
    Long transactionId,

    String publicationTitle,
    String barcode,
    String itemStatus,
    BigDecimal reversedLostFineAmount,
    BigDecimal refundAmount,
    String recoveryReason,
    String note
) {}
