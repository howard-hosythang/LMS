package com.library.auth.infrastructure.audit;

import static org.mockito.Mockito.*;

import com.library.shared.service.AuditLogService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class ChatbotAuditPrivacyTest {
    @Test void readOnlyChatDoesNotCreateMutationAuditRecordsOrLogQuestionParameters() throws Exception {
        var audit = mock(AuditLogService.class);
        var filter = new SystemAuditFilter(audit);
        for (String path : new String[]{"/api/v1/chatbot/messages", "/api/v1/chatbot/my/messages"}) {
            var request = new MockHttpServletRequest("POST", path);
            request.setQueryString("message=private-question");
            filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
        }
        verifyNoInteractions(audit);
    }

    @Test void existingMutationEndpointsRemainAudited() throws Exception {
        var audit = mock(AuditLogService.class);
        new SystemAuditFilter(audit).doFilter(new MockHttpServletRequest("POST", "/api/v1/transactions/1/confirm-pickup"),
            new MockHttpServletResponse(), new MockFilterChain());
        verify(audit).log(isNull(), eq("ANONYMOUS"), anyString(), eq("transactions"), eq("1"), anyString(), anyMap());
    }
}
