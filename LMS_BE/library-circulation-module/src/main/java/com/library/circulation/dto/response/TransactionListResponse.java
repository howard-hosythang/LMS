package com.library.circulation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.library.circulation.domain.enums.PaymentStatus;
import com.library.circulation.domain.enums.TransactionStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
public class TransactionListResponse {
    @JsonSerialize(using = ToStringSerializer.class)
    private Long transactionId;
    @JsonSerialize(using = ToStringSerializer.class)
    private Long userId;
    private String fullName;
    private String studentId;
    private String email;
    private String phoneNumber;
    private String barcode;
    private BigDecimal fineAmount;
    private BigDecimal grossFineAmount;
    private PaymentStatus finePaymentStatus;
    private String fineTypes;
    private BigDecimal depositAmount;
    private String depositStatus;
    private BigDecimal depositAppliedAmount;
    private BigDecimal depositRefundAmount;
    private BigDecimal additionalAmountDue;
    private Instant createdAt;
    private Instant borrowedDate;
    private String issueLibrarianName;
    private String issueLibrarianCode;
    private LocalDate dueDate;
    private Instant returnedDate;
    private String returnLibrarianName;
    private String returnLibrarianCode;
    private String finePaidByLibrarianName;
    private String finePaidByLibrarianCode;
    private TransactionStatus status;
    private Boolean important;
    private String note;

    public TransactionListResponse(
        Long transactionId,
        Long userId,
        String fullName,
        String studentId,
        String email,
        String phoneNumber,
        String barcode,
        BigDecimal fineAmount,
        BigDecimal grossFineAmount,
        PaymentStatus finePaymentStatus,
        String fineTypes,
        BigDecimal depositAmount,
        String depositStatus,
        BigDecimal depositAppliedAmount,
        BigDecimal depositRefundAmount,
        BigDecimal additionalAmountDue,
        Instant createdAt,
        Instant borrowedDate,
        String issueLibrarianName,
        String issueLibrarianCode,
        LocalDate dueDate,
        Instant returnedDate,
        String returnLibrarianName,
        String returnLibrarianCode,
        String finePaidByLibrarianName,
        String finePaidByLibrarianCode,
        TransactionStatus status,
        Boolean important,
        String note
    ) {
        this.transactionId = transactionId;
        this.userId = userId;
        this.fullName = fullName;
        this.studentId = studentId;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.barcode = barcode;
        this.fineAmount = fineAmount;
        this.grossFineAmount = grossFineAmount;
        this.finePaymentStatus = finePaymentStatus;
        this.fineTypes = fineTypes;
        this.depositAmount = depositAmount;
        this.depositStatus = depositStatus;
        this.depositAppliedAmount = depositAppliedAmount;
        this.depositRefundAmount = depositRefundAmount;
        this.additionalAmountDue = additionalAmountDue;
        this.createdAt = createdAt;
        this.borrowedDate = borrowedDate;
        this.issueLibrarianName = issueLibrarianName;
        this.issueLibrarianCode = issueLibrarianCode;
        this.dueDate = dueDate;
        this.returnedDate = returnedDate;
        this.returnLibrarianName = returnLibrarianName;
        this.returnLibrarianCode = returnLibrarianCode;
        this.finePaidByLibrarianName = finePaidByLibrarianName;
        this.finePaidByLibrarianCode = finePaidByLibrarianCode;
        this.status = status;
        this.important = important;
        this.note = note;
    }

    public TransactionListResponse(
        Long transactionId,
        Long userId,
        String fullName,
        String studentId,
        String email,
        String phoneNumber,
        BigDecimal fineAmount,
        PaymentStatus finePaymentStatus,
        String fineTypes,
        Instant createdAt,
        Instant borrowedDate,
        String issueLibrarianName,
        String issueLibrarianCode,
        LocalDate dueDate,
        Instant returnedDate,
        String returnLibrarianName,
        String returnLibrarianCode,
        String finePaidByLibrarianName,
        String finePaidByLibrarianCode,
        TransactionStatus status,
        Boolean important,
        String note
    ) {
        this(transactionId, userId, fullName, studentId, fineAmount, finePaymentStatus, fineTypes,
            createdAt, borrowedDate, issueLibrarianName, issueLibrarianCode, dueDate, returnedDate,
            returnLibrarianName, returnLibrarianCode, finePaidByLibrarianName, finePaidByLibrarianCode,
            status, important, note);
        this.email = email;
        this.phoneNumber = phoneNumber;
    }

    public TransactionListResponse(
        Long transactionId,
        Long userId,
        String fullName,
        String studentId,
        BigDecimal fineAmount,
        PaymentStatus finePaymentStatus,
        String fineTypes,
        Instant createdAt,
        Instant borrowedDate,
        String issueLibrarianName,
        String issueLibrarianCode,
        LocalDate dueDate,
        Instant returnedDate,
        String returnLibrarianName,
        String returnLibrarianCode,
        String finePaidByLibrarianName,
        String finePaidByLibrarianCode,
        TransactionStatus status,
        Boolean important,
        String note
    ) {
        this.transactionId = transactionId;
        this.userId = userId;
        this.fullName = fullName;
        this.studentId = studentId;
        this.fineAmount = fineAmount;
        this.finePaymentStatus = finePaymentStatus;
        this.fineTypes = fineTypes;
        this.createdAt = createdAt;
        this.borrowedDate = borrowedDate;
        this.issueLibrarianName = issueLibrarianName;
        this.issueLibrarianCode = issueLibrarianCode;
        this.dueDate = dueDate;
        this.returnedDate = returnedDate;
        this.returnLibrarianName = returnLibrarianName;
        this.returnLibrarianCode = returnLibrarianCode;
        this.finePaidByLibrarianName = finePaidByLibrarianName;
        this.finePaidByLibrarianCode = finePaidByLibrarianCode;
        this.status = status;
        this.important = important;
        this.note = note;
    }

    public TransactionListResponse(
        Long transactionId,
        Long userId,
        String fullName,
        String studentId,
        BigDecimal fineAmount,
        PaymentStatus finePaymentStatus,
        String fineTypes,
        Instant createdAt,
        Instant borrowedDate,
        LocalDate dueDate,
        Instant returnedDate,
        TransactionStatus status,
        Boolean important,
        String note
    ) {
        this.transactionId = transactionId;
        this.userId = userId;
        this.fullName = fullName;
        this.studentId = studentId;
        this.fineAmount = fineAmount;
        this.finePaymentStatus = finePaymentStatus;
        this.fineTypes = fineTypes;
        this.createdAt = createdAt;
        this.borrowedDate = borrowedDate;
        this.dueDate = dueDate;
        this.returnedDate = returnedDate;
        this.status = status;
        this.important = important;
        this.note = note;
    }

    public TransactionListResponse(
        Long transactionId,
        Long userId,
        String fullName,
        String studentId,
        BigDecimal fineAmount,
        Instant borrowedDate,
        LocalDate dueDate,
        Instant returnedDate,
        TransactionStatus status
    ) {
        this.transactionId = transactionId;
        this.userId = userId;
        this.fullName = fullName;
        this.studentId = studentId;
        this.fineAmount = fineAmount;
        this.borrowedDate = borrowedDate;
        this.dueDate = dueDate;
        this.returnedDate = returnedDate;
        this.status = status;
    }
}
