package com.library.recommendation.infrastructure.ai;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.recommendation.application.chatbot.FaqCatalog;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class FaqIntentSelectorTest {
    final ObjectMapper mapper = new ObjectMapper();
    MockRestServiceServer server;
    FaqIntentSelector selector;
    FaqCatalog catalog;

    @BeforeEach void setUp() throws Exception {
        var builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        selector = new FaqIntentSelector(mapper, "test-key", "gemini-2.5-flash-lite", builder);
        catalog = new FaqCatalog(mapper);
    }

    String envelope(String selected, String finish) throws Exception {
        return mapper.writeValueAsString(Map.of("candidates", List.of(Map.of("finishReason", finish,
            "content", Map.of("parts", List.of(Map.of("text", selected)))))));
    }

    @Test void sendsOnlyQuestionAndApprovedTopicsWithNoToolsOrApiKeyInBody() throws Exception {
        server.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent"))
            .andExpect(method(HttpMethod.POST)).andExpect(header("x-goog-api-key", "test-key"))
            .andExpect(jsonPath("$.tools").doesNotExist())
            .andExpect(jsonPath("$.generationConfig.responseJsonSchema.properties.faqId.enum").isArray())
            .andExpect(jsonPath("$.contents[0].parts[0].text").value("How can I take books home?"))
            .andExpect(jsonPath("$.contents.length()").value(1))
            .andRespond(withSuccess(envelope("{\"faqId\":\"borrow\"}", "STOP"), MediaType.APPLICATION_JSON));
        assertThat(selector.select("How can I take books home?", catalog.entries())).isEqualTo("borrow");
        server.verify();
    }

    @ParameterizedTest
    @ValueSource(strings = {"{\"faqId\":\"unknown\"}", "This is a fabricated answer", "null",
        "{\"faqId\":\"borrow\",\"answer\":\"invented text\"}", "{\"faqId\":123}"})
    void rejectsInvalidOrFreeFormProviderOutput(String payload) throws Exception {
        server.expect(anything()).andRespond(withSuccess(envelope(payload, "STOP"), MediaType.APPLICATION_JSON));
        assertThat(selector.select("Question", catalog.entries())).isNull();
        server.verify();
    }

    @Test void explicitNoMatchIsPreserved() throws Exception {
        server.expect(anything()).andRespond(withSuccess(envelope("{\"faqId\":\"NONE\"}", "STOP"), MediaType.APPLICATION_JSON));
        assertThat(selector.select("Weather?", catalog.entries())).isEqualTo("NONE");
    }

    @Test void truncatedOutputIsNotAcceptedEvenIfItLooksLikeValidJson() throws Exception {
        server.expect(anything()).andRespond(withSuccess(envelope("{\"faqId\":\"borrow\"}", "MAX_TOKENS"), MediaType.APPLICATION_JSON));
        assertThat(selector.select("Question", catalog.entries())).isNull();
    }

    @Test void providerErrorsFailClosedWithoutLeakingBody() {
        server.expect(anything()).andRespond(withServerError());
        assertThat(selector.select("Question", catalog.entries())).isNull();
    }

    @Test void missingKeyDoesNotCallProvider() {
        var unavailable = new FaqIntentSelector(mapper, "", "gemini-2.5-flash-lite", RestClient.builder());
        assertThat(unavailable.select("Question", catalog.entries())).isNull();
        server.verify();
    }
}
