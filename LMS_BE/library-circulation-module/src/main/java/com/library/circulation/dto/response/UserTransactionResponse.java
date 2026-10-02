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
    private Integer renewalCount;
    private Integer maxRenewals;
    private Boolean canRenew;
    private String cannotRenewReason;

    public UserTransactionResponse(
        Long transactionId, Long publicationId, String publicationTitle, String coverImageUrl,
        String barcode, String branch, String location, Instant pickedUpDeadline,
        Instant borrowedDate, LocalDate dueDate, Instant returnedDate, TransactionStatus status,
        BigDecimal fineAmount, BigDecimal grossFineAmount, BigDecimal depositAmount,
        String depositStatus, BigDecimal depositAppliedAmount, BigDecimal depositRefundAmount,
        BigDecimal additionalAmountDue, Boolean reviewed, Integer renewalCount) {
        this.transactionId = transactionId;
        this.publicationId = publicationId;
        this.publicationTitle = publicationTitle;
        this.coverImageUrl = coverImageUrl;
        this.barcode = barcode;
        this.branch = branch;
        this.location = location;
        this.pickedUpDeadline = pickedUpDeadline;
        this.borrowedDate = borrowedDate;
        this.dueDate = dueDate;
        this.returnedDate = returnedDate;
        this.status = status;
        this.fineAmount = fineAmount;
        this.grossFineAmount = grossFineAmount;
        this.depositAmount = depositAmount;
        this.depositStatus = depositStatus;
        this.depositAppliedAmount = depositAppliedAmount;
        this.depositRefundAmount = depositRefundAmount;
        this.additionalAmountDue = additionalAmountDue;
        this.reviewed = reviewed;
        this.renewalCount = renewalCount == null ? 0 : renewalCount;
        this.maxRenewals = 0;
        this.canRenew = false;
    }
}
