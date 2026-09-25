package com.library.circulation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.library.circulation.domain.enums.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FineResponse {
    @JsonSerialize(using = ToStringSerializer.class)
    private Long fineId;
    @JsonSerialize(using = ToStringSerializer.class)
    private Long transactionId;
    private String publicationTitle;
    private BigDecimal fineAmount;
    private com.library.user.domain.enums.ViolationType type;
    private PaymentStatus status;
    private Instant createdAt;
    private Instant paidDate;
}
