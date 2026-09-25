package com.library.recommendation.presentation.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.shared.dto.ApiResponseApp;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@RestController
@RequestMapping("/api/ai")
public class AiCallbackController {

    private static final String SIGNATURE_PREFIX = "sha256=";

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final String callbackSecret;
    private final long maxClockSkewSeconds;
    private final Clock clock;

    public AiCallbackController(
        JdbcTemplate jdbcTemplate,
        ObjectMapper objectMapper,
        @Value("${ai.callback.secret:}") String callbackSecret,
        @Value("${ai.callback.max-clock-skew-seconds:300}") long maxClockSkewSeconds
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.callbackSecret = callbackSecret;
        this.maxClockSkewSeconds = maxClockSkewSeconds;
        this.clock = Clock.systemUTC();
    }

    @PostMapping("/callback")
    public ApiResponseApp<Void> handlePublicationProcessingCallback(
        @RequestBody String body,
        @RequestHeader(name = "X-AI-Callback-Timestamp", required = false) String timestampHeader,
        @RequestHeader(name = "X-AI-Callback-Signature", required = false) String signatureHeader
    ) {
        verifySignature(body, timestampHeader, signatureHeader);
        AiProcessingCallback payload = parsePayload(body);

        if ("SUCCESS".equalsIgnoreCase(payload.status())) {
            log.info("AI publication processing succeeded: bookId={}", payload.bookId());
            updateStatusFromCallback(payload.bookId(), "SUCCESS", null);
        } else {
            log.warn(
                "AI publication processing failed: bookId={}, status={}, error={}",
                payload.bookId(),
                payload.status(),
                payload.error()
            );
            updateStatusFromCallback(payload.bookId(), "FAILED", payload.error());
        }
        return ApiResponseApp.success("AI callback received");
    }

    private AiProcessingCallback parsePayload(String body) {
        try {
            return objectMapper.readValue(body, AiProcessingCallback.class);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid AI callback payload");
        }
    }

    private void verifySignature(String body, String timestampHeader, String signatureHeader) {
        if (callbackSecret == null || callbackSecret.isBlank()) {
            log.error("AI callback rejected because ai.callback.secret is not configured");
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI callback secret is not configured");
        }
        if (timestampHeader == null || timestampHeader.isBlank()
            || signatureHeader == null || signatureHeader.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing AI callback signature");
        }

        long timestamp;
        try {
            timestamp = Long.parseLong(timestampHeader);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid AI callback timestamp");
        }

        long now = clock.instant().getEpochSecond();
        if (Math.abs(now - timestamp) > maxClockSkewSeconds) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Expired AI callback signature");
        }

        String expected = SIGNATURE_PREFIX + hmacSha256(timestampHeader + "." + body, callbackSecret);
        if (!MessageDigest.isEqual(
            expected.getBytes(StandardCharsets.UTF_8),
            signatureHeader.getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid AI callback signature");
        }
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
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to verify AI callback signature");
        }
    }

    private void updateStatusFromCallback(Long publicationId, String status, String error) {
        if (publicationId == null) {
            return;
        }
        jdbcTemplate.update(
            """
            INSERT INTO ai_engine.publication_etl_runs (
                publication_id,
                file_hash,
                status,
                error_message,
                updated_at
            )
            VALUES (?, NULL, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT (publication_id)
            DO UPDATE SET
                status = EXCLUDED.status,
                error_message = EXCLUDED.error_message,
                updated_at = CURRENT_TIMESTAMP
            """,
            publicationId,
            status,
            error
        );
    }

    public record AiProcessingCallback(
        @JsonProperty("book_id") Long bookId,
        String status,
        String error
    ) {
    }
}
