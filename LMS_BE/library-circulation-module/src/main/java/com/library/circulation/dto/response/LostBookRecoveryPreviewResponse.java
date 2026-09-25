package com.library.circulation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.math.BigDecimal;
import lombok.Builder;

@Builder
public record LostBookRecoveryPreviewResponse(
    @JsonSerialize(using = ToStringSerializer.class)
    Long transactionId,

    @JsonSerialize(using = ToStringSerializer.class)
    Long itemId,

    String publicationTitle,
    String barcode,
    String itemStatus,
    String borrowerName,
    String borrowerCode,
    BigDecimal lostFineAmount,
    BigDecimal depositAmount,
    BigDecimal depositAppliedAmount,
    BigDecimal additionalAmountDue,
    BigDecimal suggestedRefundAmount
) {}
