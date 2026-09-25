package com.library.circulation.infrastructure.payment;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class PayOsClient {

    private final RestClient restClient;
    private final String clientId;
    private final String apiKey;
    private final String checksumKey;

    public PayOsClient(
        @Value("${payos.base-url:https://api-merchant.payos.vn}") String baseUrl,
        @Value("${payos.client-id:}") String clientId,
        @Value("${payos.api-key:}") String apiKey,
        @Value("${payos.checksum-key:}") String checksumKey
    ) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.clientId = clientId;
        this.apiKey = apiKey;
        this.checksumKey = checksumKey;
    }

    public PayOsPaymentLink createPaymentLink(
        Long orderCode,
        int amount,
        String description,
        String buyerName,
        int fineCount,
        String cancelUrl,
        String returnUrl
    ) {
        requireConfigured();
        Map<String, Object> signatureData = new LinkedHashMap<>();
        signatureData.put("amount", amount);
        signatureData.put("cancelUrl", cancelUrl);
        signatureData.put("description", description);
        signatureData.put("orderCode", orderCode);
        signatureData.put("returnUrl", returnUrl);

        PayOsCreatePaymentRequest request = new PayOsCreatePaymentRequest(
            orderCode,
            amount,
            description,
            buyerName,
            java.util.List.of(new PayOsItem("Library fine payment (" + fineCount + " fines)", 1, amount)),
            cancelUrl,
            returnUrl,
            sign(signatureData)
        );

        PayOsCreatePaymentResponse response = restClient.post()
            .uri("/v2/payment-requests")
            .contentType(MediaType.APPLICATION_JSON)
            .header("x-client-id", clientId)
            .header("x-api-key", apiKey)
            .body(request)
            .retrieve()
            .onStatus(HttpStatusCode::isError, (req, res) -> {
                throw new IllegalStateException("payOS create payment failed with status " + res.getStatusCode());
            })
            .body(PayOsCreatePaymentResponse.class);

        if (response == null || response.data() == null || !"00".equals(response.code())) {
            throw new IllegalStateException("payOS create payment failed");
        }
        return new PayOsPaymentLink(
            response.data().paymentLinkId(),
            response.data().checkoutUrl(),
            response.data().qrCode()
        );
    }

    public PayOsPaymentStatus getPaymentStatus(Long orderCode) {
        requireConfigured();
        PayOsCreatePaymentResponse response = restClient.get()
            .uri("/v2/payment-requests/{orderCode}", orderCode)
            .accept(MediaType.APPLICATION_JSON)
            .header("x-client-id", clientId)
            .header("x-api-key", apiKey)
            .retrieve()
            .onStatus(HttpStatusCode::isError, (req, res) -> {
                throw new IllegalStateException("payOS get payment failed with status " + res.getStatusCode());
            })
            .body(PayOsCreatePaymentResponse.class);

        if (response == null || response.data() == null || !"00".equals(response.code())) {
            throw new IllegalStateException("payOS get payment failed");
        }
        PayOsPaymentData data = response.data();
        return new PayOsPaymentStatus(
            data.orderCode() != null ? data.orderCode() : orderCode,
            data.paymentLinkId(),
            data.amount(),
            data.status()
        );
    }

    public boolean verifyWebhook(Map<String, Object> payload) {
        requireChecksumKey();
        Object signature = payload.get("signature");
        Object data = payload.get("data");
        if (!(signature instanceof String signatureText) || !(data instanceof Map<?, ?> dataMap)) {
            return false;
        }
        Map<String, Object> normalized = new TreeMap<>();
        dataMap.forEach((key, value) -> normalized.put(String.valueOf(key), value));
        return sign(normalized).equals(signatureText);
    }

    private void requireConfigured() {
        if (clientId.isBlank() || apiKey.isBlank() || checksumKey.isBlank()) {
            throw new IllegalStateException("payOS credentials are not configured");
        }
    }

    private void requireChecksumKey() {
        if (checksumKey.isBlank()) {
            throw new IllegalStateException("payOS checksum key is not configured");
        }
    }

    private String sign(Map<String, Object> data) {
        String rawData = data.entrySet().stream()
            .sorted(Comparator.comparing(Map.Entry::getKey))
            .map(entry -> entry.getKey() + "=" + stringify(entry.getValue()))
            .collect(Collectors.joining("&"));
        return hmacSha256(rawData, checksumKey);
    }

    private String stringify(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String hmacSha256(String message, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to create payOS signature", e);
        }
    }

    public record PayOsPaymentLink(
        String paymentLinkId,
        String checkoutUrl,
        String qrCode
    ) {
    }

    public record PayOsPaymentStatus(
        Long orderCode,
        String paymentLinkId,
        Integer amount,
        String status
    ) {
    }

    private record PayOsCreatePaymentRequest(
        Long orderCode,
        Integer amount,
        String description,
        String buyerName,
        java.util.List<PayOsItem> items,
        String cancelUrl,
        String returnUrl,
        String signature
    ) {
    }

    private record PayOsItem(
        String name,
        Integer quantity,
        Integer price
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record PayOsCreatePaymentResponse(
        String code,
        String desc,
        PayOsPaymentData data,
        String signature
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record PayOsPaymentData(
        @JsonProperty("paymentLinkId") String paymentLinkId,
        @JsonProperty("checkoutUrl") String checkoutUrl,
        @JsonProperty("qrCode") String qrCode,
        @JsonProperty("orderCode") Long orderCode,
        @JsonProperty("amount") Integer amount,
        @JsonProperty("status") String status
    ) {
    }
}
