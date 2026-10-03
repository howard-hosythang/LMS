package com.library.circulation.dto.response;

import java.math.BigDecimal;

public record DepositPaymentResponse(Long orderCode, String status, BigDecimal amount, String description,
    String paymentLinkId, String checkoutUrl, String qrCode, String studentId, String fullName, String barcode,
    String publicationTitle) {}
