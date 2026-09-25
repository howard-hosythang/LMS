package com.library.recommendation.presentation.controller;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@DisplayName("AiCallbackController — HMAC contract")
class AiCallbackControllerTest {

    private static final String SECRET = "test-ai-callback-secret";

    private JdbcTemplate jdbcTemplate;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        jdbcTemplate = org.mockito.Mockito.mock(JdbcTemplate.class);
        AiCallbackController controller = new AiCallbackController(
            jdbcTemplate,
            new ObjectMapper(),
            SECRET,
            300
        );
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("accepts signed AI callback and updates ETL status")
    void callback_shouldAcceptSignedPayload() throws Exception {
        String body = "{\"book_id\":1,\"status\":\"SUCCESS\"}";
        String timestamp = String.valueOf(System.currentTimeMillis() / 1000);

        mockMvc.perform(post("/api/ai/callback")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-AI-Callback-Timestamp", timestamp)
                .header("X-AI-Callback-Signature", sign(timestamp, body))
                .content(body))
            .andExpect(status().isOk());

        verify(jdbcTemplate).update(anyString(), eq(1L), eq("SUCCESS"), isNull());
    }

    @Test
    @DisplayName("rejects unsigned AI callback")
    void callback_shouldRejectMissingSignature() throws Exception {
        String body = "{\"book_id\":1,\"status\":\"SUCCESS\"}";

        mockMvc.perform(post("/api/ai/callback")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isUnauthorized());

        verify(jdbcTemplate, never()).update(anyString(), org.mockito.ArgumentMatchers.<Object[]>any());
    }

    @Test
    @DisplayName("rejects tampered AI callback body")
    void callback_shouldRejectTamperedBody() throws Exception {
        String signedBody = "{\"book_id\":1,\"status\":\"SUCCESS\"}";
        String tamperedBody = "{\"book_id\":2,\"status\":\"SUCCESS\"}";
        String timestamp = String.valueOf(System.currentTimeMillis() / 1000);

        mockMvc.perform(post("/api/ai/callback")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-AI-Callback-Timestamp", timestamp)
                .header("X-AI-Callback-Signature", sign(timestamp, signedBody))
                .content(tamperedBody))
            .andExpect(status().isUnauthorized());

        verify(jdbcTemplate, never()).update(anyString(), org.mockito.ArgumentMatchers.<Object[]>any());
    }

    private String sign(String timestamp, String body) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] digest = mac.doFinal((timestamp + "." + body).getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder(digest.length * 2);
        for (byte b : digest) {
            hex.append(String.format("%02x", b));
        }
        return "sha256=" + hex;
    }
}
