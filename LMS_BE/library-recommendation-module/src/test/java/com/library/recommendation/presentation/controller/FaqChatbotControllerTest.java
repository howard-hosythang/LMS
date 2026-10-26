package com.library.recommendation.presentation.controller;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.recommendation.application.chatbot.FaqChatbotService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.server.ResponseStatusException;

class FaqChatbotControllerTest {
    final ObjectMapper mapper = new ObjectMapper();
    FaqChatbotService service;
    MockMvc mvc;

    @BeforeEach void setUp() {
        service = mock(FaqChatbotService.class);
        var validator = new LocalValidatorFactoryBean(); validator.afterPropertiesSet();
        mvc = MockMvcBuilders.standaloneSetup(new FaqChatbotController(service))
            .setValidator(validator).build();
    }

    @Test void suggestionsArePublicContentWithoutAnswersOrAccountFields() throws Exception {
        when(service.suggestions("en")).thenReturn(List.of(new FaqChatbotService.Suggestion("borrow", "How do I borrow?")));
        mvc.perform(get("/api/v1/chatbot/faqs").param("language", "en"))
            .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.data[0].id").value("borrow"))
            .andExpect(jsonPath("$.data[0].answer").doesNotExist());
    }

    @Test void validRequestIsTrimmedAndReturnsReviewedAnswer() throws Exception {
        when(service.answer("Cách mượn sách?", "vi")).thenReturn(new FaqChatbotService.Answer(
            "ANSWERED", "borrow", "Reviewed answer", "Borrow", "/publicpage/guide"));
        mvc.perform(post("/api/v1/chatbot/messages").contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of("message", " Cách mượn sách? ", "language", "vi"))))
            .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.data.answer").value("Reviewed answer"));
    }

    @ParameterizedTest @ValueSource(strings = {"", "   "})
    void emptyMessagesAreRejected(String value) throws Exception {
        mvc.perform(post("/api/v1/chatbot/messages").contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(Map.of("message", value)))).andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test void longMessageOrUnsupportedLanguageIsRejectedBeforeProviderCall() throws Exception {
        for (var payload : List.of(Map.of("message", "a".repeat(501)), Map.of("message", "hello", "language", "fr"))) {
            mvc.perform(post("/api/v1/chatbot/messages").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(payload))).andExpect(status().isBadRequest());
        }
        verifyNoInteractions(service);
    }

    @Test void exhaustedBudgetReturns429() throws Exception {
        when(service.answer(anyString(), any())).thenThrow(new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS));
        mvc.perform(post("/api/v1/chatbot/messages").contentType(MediaType.APPLICATION_JSON)
            .content("{\"message\":\"hello\"}")).andExpect(status().isTooManyRequests());
    }
}
