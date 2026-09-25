package com.library.circulation.dto.response;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FinePaymentLinkResponse {
    private Long orderCode;
    private String paymentLinkId;
    private String checkoutUrl;
    private String qrCode;
    private String description;
    private BigDecimal amount;
    private Integer fineCount;
    private String studentId;
    private String fullName;
}
