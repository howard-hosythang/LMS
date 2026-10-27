package com.library.recommendation.application.chatbot;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.recommendation.infrastructure.ai.ChatbotKnowledgeClient;
import com.library.recommendation.infrastructure.ai.FaqIntentSelector;
import com.library.recommendation.infrastructure.persistence.ChatbotReadQueries;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ChatbotServiceTest {
    final ObjectMapper mapper = new ObjectMapper();
    FaqCatalog catalog;
    FaqIntentSelector model;
    ChatbotKnowledgeClient knowledge;
    ChatbotReadQueries reads;
    ChatbotService service;
    @BeforeEach void setup() throws Exception {
        catalog = new FaqCatalog(mapper); model = mock(FaqIntentSelector.class);
        knowledge = mock(ChatbotKnowledgeClient.class); reads = mock(ChatbotReadQueries.class);
        service = new ChatbotService(catalog, new FaqChatbotService(catalog, model), model, knowledge, reads);
    }
    @Test void exactFaqWorksWithoutProviderOrVectorStore() {
        assertThat(service.answer("Ai tạo trang web này?", "vi", null).answer()).contains("Võ Quang Thắng");
        verifyNoInteractions(model, reads, knowledge);
    }
    @Test void privateResultsAreScopedAndNeverUploadedToTheModel() throws Exception {
        when(model.chooseTool(anyString(), anyList(), eq("vi")))
            .thenReturn(new FaqIntentSelector.ToolCall("get_my_fines", mapper.readTree("{}")));
        when(reads.execute(eq(ChatbotTool.get_my_fines), any(), eq(7L), eq("vi")))
            .thenReturn(ChatbotReply.message("ANSWERED", "Sensitive reader result"));
        assertThat(service.answer("Tôi còn nợ phạt bao nhiêu?", "vi", 7L).answer()).contains("Sensitive reader result");
        verify(model).chooseTool(eq("Tôi còn nợ phạt bao nhiêu?"), anyList(), eq("vi"));
        verifyNoMoreInteractions(model);
        verifyNoInteractions(knowledge);
    }
    @Test void anonymousCannotExecuteAProtectedToolEvenWhenModelProposesIt() throws Exception {
        when(model.chooseTool(anyString(), anyList(), anyString()))
            .thenReturn(new FaqIntentSelector.ToolCall("get_my_loans", mapper.readTree("{}")));
        assertThat(service.answer("My loans", "en", null).status()).isEqualTo("UNAVAILABLE");
        verifyNoInteractions(reads, knowledge);
    }
    @Test void modelSuppliedIdentityIsRejectedBeforeAnyDatabaseLookup() throws Exception {
        when(model.chooseTool(anyString(), anyList(), anyString()))
            .thenReturn(new FaqIntentSelector.ToolCall("get_my_fines", mapper.readTree("{\"userId\":999}")));
        assertThat(service.answer("My fines", "en", 7L).status()).isEqualTo("CLARIFY");
        verifyNoInteractions(reads);
    }
    @Test void unsupportedWriteToolCannotReachTheDatabase() throws Exception {
        when(model.chooseTool(anyString(), anyList(), anyString()))
            .thenReturn(new FaqIntentSelector.ToolCall("renew_book", mapper.readTree("{}")));
        assertThat(service.answer("Renew for me", "en", 7L).status()).isEqualTo("CLARIFY");
        verifyNoInteractions(reads);
    }
    @Test void helpOnlyUsesRetrievedEntriesAndKeepsServerOwnedSources() throws Exception {
        var source = catalog.find("borrow").orElseThrow();
        when(model.chooseTool(anyString(), anyList(), anyString()))
            .thenReturn(new FaqIntentSelector.ToolCall("search_library_help", mapper.readTree("{\"query\":\"borrow\"}")));
        when(knowledge.retrieve("borrow", "en")).thenReturn(List.of(source));
        when(model.generate("Explain borrowing please", List.of(source), "en"))
            .thenReturn(new FaqIntentSelector.Draft("borrow", null));
        var answer = service.answer("Explain borrowing please", "en", null);
        assertThat(answer.status()).isEqualTo("ANSWERED");
        assertThat(answer.sourcePath()).isEqualTo("/publicpage/guide");
        assertThat(answer.content().steps()).isNotEmpty();
        verifyNoInteractions(reads);
    }
    @Test void missingIndexDoesNotFallBackToUnrestrictedKnowledge() throws Exception {
        when(model.chooseTool(anyString(), anyList(), anyString()))
            .thenReturn(new FaqIntentSelector.ToolCall("search_library_help", mapper.readTree("{}")));
        when(knowledge.retrieve(anyString(), anyString())).thenReturn(List.of());
        assertThat(service.answer("Explain an unrecognized process", "en", null).status()).isEqualTo("UNAVAILABLE");
        verify(model, never()).generate(anyString(), anyList(), anyString());
    }
    @Test void noMatchAndSignInRequestsDoNotInventData() throws Exception {
        when(model.chooseTool(anyString(), anyList(), anyString()))
            .thenReturn(new FaqIntentSelector.ToolCall("NONE", mapper.readTree("{}")))
            .thenReturn(new FaqIntentSelector.ToolCall("AUTH_REQUIRED", mapper.readTree("{}")));
        assertThat(service.answer("Explain chapter 5", "en", null).status()).isEqualTo("UNSUPPORTED");
        assertThat(service.answer("My fines", "en", null).sourcePath()).isEqualTo("/publicpage/login");
        verifyNoInteractions(reads);
    }
}
