package com.library.auth.infrastructure.config;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

@ExtendWith(SpringExtension.class)
@WebAppConfiguration
@ContextConfiguration(classes = {SecurityConfig.class, FaqPublicSecurityTest.TestConfig.class})
class FaqPublicSecurityTest {
    @Autowired WebApplicationContext context;
    @Autowired CustomJwtDecoder decoder;
    @Autowired CustomAuthenticationConverter converter;
    MockMvc mvc;

    @BeforeEach void setUp() {
        clearInvocations(decoder, converter);
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test void anonymousFaqRequestsPassTheRealSecurityChainWithoutTokenOrUserLookup() throws Exception {
        mvc.perform(get("/api/v1/chatbot/faqs")).andExpect(status().isOk());
        mvc.perform(post("/api/v1/chatbot/messages")).andExpect(status().isOk());
        verifyNoInteractions(decoder, converter);
    }

    @Test void otherMethodsAndProtectedRoutesRemainAuthenticated() throws Exception {
        mvc.perform(get("/api/v1/chatbot/messages")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/chatbot/faqs")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/librarians/dashboard")).andExpect(status().isUnauthorized());
    }

    @Configuration @EnableWebMvc
    static class TestConfig {
        @Bean CustomJwtDecoder decoder() { return mock(CustomJwtDecoder.class); }
        @Bean CustomAuthenticationConverter converter() { return mock(CustomAuthenticationConverter.class); }
        @Bean CustomAccessDeniedHandler accessDenied() { return mock(CustomAccessDeniedHandler.class); }
        @Bean CustomAuthenticationEntryPoint entryPoint() throws Exception {
            var handler = mock(CustomAuthenticationEntryPoint.class);
            doAnswer(invocation -> {
                ((jakarta.servlet.http.HttpServletResponse) invocation.getArgument(1)).setStatus(401);
                return null;
            }).when(handler).commence(any(), any(), any());
            return handler;
        }
        @Bean WebClient.Builder webClientBuilder() { return WebClient.builder(); }
        @Bean StubEndpoints endpoints() { return new StubEndpoints(); }
    }

    @RestController
    static class StubEndpoints {
        @GetMapping("/api/v1/chatbot/faqs") String suggestions() { return "reviewed questions"; }
        @PostMapping("/api/v1/chatbot/messages") String message() { return "reviewed answer"; }
    }
}
