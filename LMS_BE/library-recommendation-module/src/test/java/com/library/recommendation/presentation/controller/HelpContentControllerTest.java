package com.library.recommendation.presentation.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.recommendation.application.chatbot.FaqCatalog;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class HelpContentControllerTest {
    @Test void returnsTheSameCatalogVersionAndLocalizedContentUsedByTheChatbot() throws Exception {
        var catalog = new FaqCatalog(new ObjectMapper());
        var mvc = MockMvcBuilders.standaloneSetup(new HelpContentController(catalog)).build();
        mvc.perform(get("/api/v1/help/content").param("language", "en"))
            .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.data.version").value(catalog.version()))
            .andExpect(jsonPath("$.data.topics[0].question").value(catalog.entries().get(0).en().question()))
            .andExpect(jsonPath("$.data.topics[0].content.summary").isNotEmpty());
        mvc.perform(get("/api/v1/help/content").param("language", "fr")).andExpect(status().isBadRequest());
    }
}
