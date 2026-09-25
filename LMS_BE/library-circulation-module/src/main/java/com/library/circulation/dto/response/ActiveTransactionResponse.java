package com.library.circulation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.library.circulation.domain.enums.TransactionStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ActiveTransactionResponse {
    @JsonSerialize(using = ToStringSerializer.class)
    private Long transactionId;
    @JsonSerialize(using = ToStringSerializer.class)
    private Long userId;
    private String studentId;
    private String fullName;
    private String publicationTitle;
    private String barcode;
    private String branch;
    private String location;
    private Instant borrowedDate;
    private LocalDate dueDate;
    private TransactionStatus status;
    private BigDecimal depositAmount;
    private String depositStatus;
}
