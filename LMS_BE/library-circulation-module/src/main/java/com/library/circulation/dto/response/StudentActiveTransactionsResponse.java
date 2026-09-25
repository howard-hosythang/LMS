package com.library.circulation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.library.circulation.domain.enums.TransactionStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StudentActiveTransactionsResponse {
    private String studentId;
    private String fullName;
    private List<ActiveItem> items;

    @Data
    @Builder
    public static class ActiveItem {
        @JsonSerialize(using = ToStringSerializer.class)
        private Long transactionId;
        private String publicationTitle;
        private String barcode;
        private String branch;
        private String location;
        private Instant borrowedDate;
        private LocalDate dueDate;
        private TransactionStatus status;
    }
}
