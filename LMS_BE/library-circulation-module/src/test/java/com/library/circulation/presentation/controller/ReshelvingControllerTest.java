package com.library.circulation.presentation.controller;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.library.circulation.application.reshelving.ReshelvingService;
import com.library.shared.util.SecurityEvaluator;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class ReshelvingControllerTest {
    @Mock ReshelvingService service;
    @Mock SecurityEvaluator security;
    @InjectMocks ReshelvingController controller;
    MockMvc mvc;
    @BeforeEach void setup() { mvc = MockMvcBuilders.standaloneSetup(controller).build(); }

    @Test void countReturnsCurrentQueueCount() throws Exception {
        when(service.countWaiting(null)).thenReturn(12L);
        mvc.perform(get("/api/v1/librarians/reshelving/count")).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.count").value(12));
    }

    @Test void confirmsUsingAuthenticatedLibrarianAndStringIds() throws Exception {
        when(security.getCurrentUserId()).thenReturn(7L);
        when(service.confirm(List.of(1L, 2L), 7L, "Cơ sở 1 - Lý Thường Kiệt")).thenReturn(Map.of("updatedCount", 1, "skippedCount", 1));
        mvc.perform(post("/api/v1/librarians/reshelving/confirm").contentType("application/json")
            .content("{\"taskIds\":[\"1\",\"2\"],\"branch\":\"Cơ sở 1 - Lý Thường Kiệt\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.updatedCount").value(1));
    }

    @Test void emptySelectionIsBadRequest() throws Exception {
        mvc.perform(post("/api/v1/librarians/reshelving/confirm").contentType("application/json")
            .content("{\"taskIds\":[]}"))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test void missingBranchCannotConfirmEvenValidIds() throws Exception {
        mvc.perform(post("/api/v1/librarians/reshelving/confirm").contentType("application/json")
            .content("{\"taskIds\":[\"1\"]}"))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }

    @Test void branchFilterIsPassedToQueueAndCount() throws Exception {
        String branch = "Cơ sở 2 - Dĩ An";
        when(service.getWaiting(branch)).thenReturn(List.of());
        when(service.countWaiting(branch)).thenReturn(3L);
        mvc.perform(get("/api/v1/librarians/reshelving").param("branch", branch)).andExpect(status().isOk());
        mvc.perform(get("/api/v1/librarians/reshelving/count").param("branch", branch))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.count").value(3));
        verify(service).getWaiting(branch);
    }
}
