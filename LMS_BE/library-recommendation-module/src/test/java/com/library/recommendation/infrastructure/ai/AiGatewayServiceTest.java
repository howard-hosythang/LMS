package com.library.recommendation.infrastructure.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

@DisplayName("AiGatewayService — BE-AI contract")
class AiGatewayServiceTest {

    private HttpServer server;
    private AiGatewayService gateway;
    private JdbcTemplate jdbcTemplate;
    private final AtomicReference<String> requestBody = new AtomicReference<>();
    private final AtomicReference<String> requestPath = new AtomicReference<>();

    @BeforeEach
    void setUp() throws IOException {
        server = HttpServer.create(new InetSocketAddress(0), 0);
        server.start();
        String baseUrl = "http://localhost:" + server.getAddress().getPort();
        jdbcTemplate = org.mockito.Mockito.mock(JdbcTemplate.class);
        gateway = new AiGatewayService(baseUrl, 500, 1_000, 1_000, jdbcTemplate);
    }

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    @DisplayName("recommendation endpoint maps snake_case response into Java record")
    void getRecommendations_shouldPostExpectedPayloadAndMapResponse() {
        server.createContext("/api/v1/recommendations", exchange ->
            respond(exchange, 200, "{\"publication_ids\":[1,2,3],\"strategy\":\"AI_PERSONALIZED\"}"));

        AiGatewayService.AiRecommendationResult result = gateway.getRecommendations(4L, 6);

        assertThat(requestPath.get()).isEqualTo("/api/v1/recommendations");
        assertThat(requestBody.get()).contains("\"user_id\":4").contains("\"limit\":6");
        assertThat(result.publicationIds()).containsExactly(1L, 2L, 3L);
        assertThat(result.strategy()).isEqualTo("AI_PERSONALIZED");
    }

    @Test
    @DisplayName("semantic-search endpoint maps snake_case response into Java record")
    void semanticSearch_shouldPostExpectedPayloadAndMapResponse() {
        server.createContext("/api/v1/semantic-search", exchange ->
            respond(exchange, 200, "{\"publication_ids\":[7,8]}"));

        AiGatewayService.AiSemanticSearchResult result = gateway.semanticSearch("machine learning", 5);

        assertThat(requestPath.get()).isEqualTo("/api/v1/semantic-search");
        assertThat(requestBody.get()).contains("\"query_text\":\"machine learning\"").contains("\"limit\":5");
        assertThat(result.publicationIds()).containsExactly(7L, 8L);
    }

    @Test
    @DisplayName("gateway failure degrades recommendation contract to empty fallback")
    void getRecommendations_shouldReturnFallback_whenGatewayFails() {
        server.createContext("/api/v1/recommendations", exchange ->
            respond(exchange, 500, "{\"detail\":\"AI service failed\"}"));

        AiGatewayService.AiRecommendationResult result = gateway.getRecommendations(4L, 6);

        assertThat(result.publicationIds()).isEmpty();
        assertThat(result.strategy()).isEqualTo("AI_GATEWAY_UNAVAILABLE");
    }

    @Test
    @DisplayName("publication processing accepts JSON body even when AI service labels it octet-stream")
    void processPublication_shouldAcceptOctetStreamJsonResponse() {
        server.createContext("/api/v1/publications/process", exchange ->
            respond(
                exchange,
                200,
                "application/octet-stream",
                """
                {
                  "publication_id": 42,
                  "status": "SUCCESS",
                  "skipped": false,
                  "chunks": 12,
                  "vectors": 12,
                  "summary_generated": true,
                  "tags": ["Database"],
                  "ai_target_audience": "Computer science students"
                }
                """
            ));

        gateway.processPublication(42L, "https://storage.example/book.pdf", true);

        assertThat(requestPath.get()).isEqualTo("/api/v1/publications/process");
        assertThat(requestBody.get())
            .contains("\"publication_id\":42")
            .contains("\"pdf_url\":\"https://storage.example/book.pdf\"")
            .contains("\"force_reprocess\":true");
        verify(jdbcTemplate, never()).update(anyString(), any(), any());
    }

    private void respond(HttpExchange exchange, int statusCode, String response) throws IOException {
        respond(exchange, statusCode, "application/json", response);
    }

    private void respond(HttpExchange exchange, int statusCode, String contentType, String response) throws IOException {
        requestPath.set(exchange.getRequestURI().getPath());
        requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}
