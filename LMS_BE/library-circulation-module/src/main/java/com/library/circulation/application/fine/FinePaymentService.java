package com.library.circulation.application.fine;

import com.library.circulation.dto.response.FinePaymentLinkResponse;

public interface FinePaymentService {
    FinePaymentLinkResponse createPayOsPaymentLink(String studentId, Long librarianId);

    int syncPayOsPayment(Long orderCode, Long librarianId);

    int confirmPayOsWebhook(String rawBody);
}
