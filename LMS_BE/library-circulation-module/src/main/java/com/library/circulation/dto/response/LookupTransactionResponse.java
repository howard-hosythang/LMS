package com.library.circulation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.library.circulation.domain.enums.TransactionStatus;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LookupTransactionResponse {
    @JsonSerialize(using = ToStringSerializer.class)
    private Long transactionId;
    @JsonSerialize(using = ToStringSerializer.class)
    private Long userId;
    private String studentId;
    private String fullName;
    @JsonSerialize(using = ToStringSerializer.class)
    private Long itemId;
    private String barcode;
    @JsonSerialize(using = ToStringSerializer.class)
    private Long publicationId;
    private String publicationTitle;
    private String branch;
    private String location;
    private Instant pickedUpDeadline;
    private TransactionStatus status;
    private BigDecimal depositAmount;
    private String depositStatus;
}
