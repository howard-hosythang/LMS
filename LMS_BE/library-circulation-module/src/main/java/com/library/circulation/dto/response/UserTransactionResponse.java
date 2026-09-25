package com.library.circulation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.library.circulation.domain.enums.TransactionStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserTransactionResponse {
    @JsonSerialize(using = ToStringSerializer.class)
    private Long transactionId;
    @JsonSerialize(using = ToStringSerializer.class)
    private Long publicationId;
    private String publicationTitle;
    private String coverImageUrl;
    private String barcode;
    private String branch;
    private String location;
    private Instant pickedUpDeadline;
    private Instant borrowedDate;
    private LocalDate dueDate;
    private Instant returnedDate;
    private TransactionStatus status;
    private BigDecimal fineAmount;
    private BigDecimal grossFineAmount;
    private BigDecimal depositAmount;
    private String depositStatus;
    private BigDecimal depositAppliedAmount;
    private BigDecimal depositRefundAmount;
    private BigDecimal additionalAmountDue;
    private Boolean reviewed;
}
