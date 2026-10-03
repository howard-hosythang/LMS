package com.library.circulation.presentation.controller;

import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.library.circulation.application.inquiry.CirculationInquiryService;
import com.library.shared.dto.PageResponse;
import com.library.shared.util.RequiresRole;
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
import org.springframework.web.bind.annotation.GetMapping;

@ExtendWith(MockitoExtension.class)
class CirculationInquiryControllerTest {
    @Mock CirculationInquiryService service;
    @InjectMocks CirculationInquiryController controller;
    MockMvc mvc;
    @BeforeEach void setup() { mvc = MockMvcBuilders.standaloneSetup(controller).build(); }

    @Test void barcodeLookupPreservesExactCodeAndStringIds() throws Exception {
        when(service.barcode("BC-00123")).thenReturn(Map.of("itemId", "894180930999234781", "barcode", "BC-00123"));
        mvc.perform(get("/api/v1/librarians/inquiry/items/barcode").param("barcode", "BC-00123"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.itemId").value("894180930999234781"));
        verify(service).barcode("BC-00123");
    }

    @Test void timelinePassesPageAndSizeToReadModel() throws Exception {
        when(service.timeline(5L, 2, 20)).thenReturn(PageResponse.<Map<String, Object>>builder().content(List.of()).currentPage(2).build());
        mvc.perform(get("/api/v1/librarians/inquiry/items/5/timeline").param("page", "2"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.currentPage").value(2));
    }

    @Test void everyNewEndpointRequiresLibrarianAndExposesOnlyGetOperations() {
        for (var method : CirculationInquiryController.class.getDeclaredMethods()) {
            assertThat(method.getAnnotation(RequiresRole.class)).isNotNull();
            assertThat(method.getAnnotation(GetMapping.class)).isNotNull();
        }
    }
}
