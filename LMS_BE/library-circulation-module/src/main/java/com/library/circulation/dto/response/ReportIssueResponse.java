package com.library.circulation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;

@Builder
public record ReportIssueResponse(
    @JsonSerialize(using = ToStringSerializer.class)
    Long transactionId,

    String publicationTitle,
    String itemStatus,
    List<FineDetail> finesCreated,
    BigDecimal depositAmount,
    String depositStatus,
    BigDecimal grossFineAmount,
    BigDecimal depositAppliedAmount,
    BigDecimal depositRefundAmount,
    BigDecimal additionalAmountDue
) {
    @Builder
    public record FineDetail(
        @JsonSerialize(using = ToStringSerializer.class)
        Long fineId,
        com.library.user.domain.enums.ViolationType type,
        BigDecimal amount
    ) {}
}
