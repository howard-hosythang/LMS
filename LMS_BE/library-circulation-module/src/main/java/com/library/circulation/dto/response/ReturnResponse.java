package com.library.circulation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Builder;

@Builder
public record ReturnResponse(
    @JsonSerialize(using = ToStringSerializer.class)
    Long transactionId,

    String publicationTitle,
    String barcode,
    LocalDate returnedDate,
    boolean overdue,
    BigDecimal overdueFineAmount,
    BigDecimal depositAmount,
    String depositStatus,
    BigDecimal grossFineAmount,
    BigDecimal depositAppliedAmount,
    BigDecimal depositRefundAmount,
    BigDecimal additionalAmountDue
) {}
