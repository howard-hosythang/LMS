package com.library.catalog.presentation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.catalog.application.BookLookupUseCase;
import com.library.catalog.application.CreatePublicationUseCase;
import com.library.catalog.application.DeletePublicationUseCase;
import com.library.catalog.application.GetDocumentUploadUrlUseCase;
import com.library.catalog.application.GetListPublicationForLibrarianUseCase;
import com.library.catalog.application.GetMostBorrowedPublicationsUseCase;
import com.library.catalog.application.GetNewestPublicationsUseCase;
import com.library.catalog.application.GetPublicationByIdByUseCase;
import com.library.catalog.application.GetPublicLibraryStatsUseCase;
import com.library.catalog.application.GetPublicTestimonialsUseCase;
import com.library.catalog.application.RecordPublicationViewUseCase;
import com.library.catalog.application.SaveDocumentUrlUseCase;
import com.library.catalog.application.SearchPublicationsUseCase;
import com.library.catalog.application.UpdatePublicationUseCase;
import com.library.catalog.application.UploadPublicationCoverUseCase;
import com.library.catalog.application.publication.GetAllItemsByPublicationId;
import com.library.catalog.dto.request.publication.CreatePublicationRequest;
import com.library.catalog.dto.request.publication.PublicSearchRequest;
import com.library.catalog.dto.request.publication.SaveDocumentUrlRequest;
import com.library.catalog.dto.response.publication.DocumentUploadUrlResponse;
import com.library.catalog.dto.response.publication.PublicSearchResult;
import com.library.shared.dto.PageResponse;
import com.library.shared.util.SecurityEvaluator;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

@ExtendWith(MockitoExtension.class)
@DisplayName("PublicationController — MockMvc")
class PublicationControllerTest {

    @Mock private BookLookupUseCase bookLookupUseCase;
    @Mock private DeletePublicationUseCase deletePublicationUseCase;
    @Mock private GetListPublicationForLibrarianUseCase getListPublicationForLibrarianUseCase;
    @Mock private GetPublicationByIdByUseCase getPublicationByIdByUseCase;
    @Mock private RecordPublicationViewUseCase recordPublicationViewUseCase;
    @Mock private SecurityEvaluator securityEvaluator;
    @Mock private UpdatePublicationUseCase updatePublicationUseCase;
    @Mock private CreatePublicationUseCase createPublicationUseCase;
    @Mock private GetNewestPublicationsUseCase getNewestPublicationsUseCase;
    @Mock private GetMostBorrowedPublicationsUseCase getMostBorrowedPublicationsUseCase;
    @Mock private GetAllItemsByPublicationId getAllItemsByPublicationId;
    @Mock private SearchPublicationsUseCase searchPublicationsUseCase;
    @Mock private UploadPublicationCoverUseCase uploadPublicationCoverUseCase;
    @Mock private GetDocumentUploadUrlUseCase getDocumentUploadUrlUseCase;
    @Mock private SaveDocumentUrlUseCase saveDocumentUrlUseCase;
    @Mock private GetPublicLibraryStatsUseCase getPublicLibraryStatsUseCase;
    @Mock private GetPublicTestimonialsUseCase getPublicTestimonialsUseCase;

    @InjectMocks private PublicationController controller;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setValidator(validator)
            .build();
    }

    @Test
    @DisplayName("POST /publications creates publication and returns created id")
    void createPublication_shouldReturnCreatedId() throws Exception {
        CreatePublicationRequest request = new CreatePublicationRequest(
            "9780132350884",
            "Clean Code",
            null,
            "desc",
            "en",
            464,
            null,
            null,
            2008,
            1,
            null,
            null,
            null,
            null,
            10L,
            null,
            new Long[] {11L},
            new Long[] {21L},
            new Long[] {31L},
            "QA76.76",
            null
        );
        when(createPublicationUseCase.execute(any(CreatePublicationRequest.class), any())).thenReturn(42L);

        mockMvc.perform(post("/api/v1/publications")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.code").value(201))
            .andExpect(jsonPath("$.message").value("Created successfully"))
            .andExpect(jsonPath("$.data").value("42"));

        verify(createPublicationUseCase).execute(any(CreatePublicationRequest.class), any());
    }

    @Test
    @DisplayName("GET /publications/search forwards filters and Accept-Language")
    void searchPublications_shouldForwardRequestAndLanguageHeader() throws Exception {
        PublicSearchResult item = new PublicSearchResult(
            42L,
            "Clean Code",
            "cover.jpg",
            2008,
            "desc",
            "Prentice Hall",
            "Robert C. Martin",
            "Software Engineering",
            "Clean Code",
            3,
            1,
            4.5,
            8L,
            20L
        );
        PageResponse<PublicSearchResult> page = PageResponse.<PublicSearchResult>builder()
            .content(List.of(item))
            .currentPage(1)
            .pageSize(5)
            .totalElements(6)
            .totalPages(2)
            .isFirst(false)
            .isLast(true)
            .build();
        when(searchPublicationsUseCase.execute(any(PublicSearchRequest.class), eq("en-US")))
            .thenReturn(page);

        mockMvc.perform(get("/api/v1/publications/search")
                .header("Accept-Language", "en-US")
                .param("keyword", "clean")
                .param("categoryIds", "1", "2")
                .param("available", "true")
                .param("branch", "Central")
                .param("sortBy", "rating")
                .param("page", "1")
                .param("size", "5"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.content[0].publicationId").value("42"))
            .andExpect(jsonPath("$.data.content[0].title").value("Clean Code"))
            .andExpect(jsonPath("$.data.totalElements").value(6));

        ArgumentCaptor<PublicSearchRequest> captor =
            ArgumentCaptor.forClass(PublicSearchRequest.class);
        verify(searchPublicationsUseCase).execute(captor.capture(), eq("en-US"));
        org.assertj.core.api.Assertions.assertThat(captor.getValue().getKeyword()).isEqualTo("clean");
        org.assertj.core.api.Assertions.assertThat(captor.getValue().getCategoryIds()).containsExactly(1L, 2L);
        org.assertj.core.api.Assertions.assertThat(captor.getValue().getAvailable()).isTrue();
    }

    @Test
    @DisplayName("document upload endpoints call document use cases")
    void documentEndpoints_shouldCallDocumentUseCases() throws Exception {
        when(getDocumentUploadUrlUseCase.execute(42L, "book.pdf"))
            .thenReturn(new DocumentUploadUrlResponse("https://s3.example/upload", "docs/book.pdf"));
        when(saveDocumentUrlUseCase.execute(42L, "docs/book.pdf"))
            .thenReturn("https://cdn.example/book.pdf");
        when(saveDocumentUrlUseCase.upload(eq(42L), any()))
            .thenReturn("https://cdn.example/uploaded.pdf");

        mockMvc.perform(get("/api/v1/publications/{id}/document-upload-url", 42L)
                .param("filename", "book.pdf"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.uploadUrl").value("https://s3.example/upload"))
            .andExpect(jsonPath("$.data.s3Key").value("docs/book.pdf"));

        mockMvc.perform(put("/api/v1/publications/{id}/document-url", 42L)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new SaveDocumentUrlRequest("docs/book.pdf"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").value("https://cdn.example/book.pdf"));

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "book.pdf",
            "application/pdf",
            "pdf".getBytes()
        );

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .multipart("/api/v1/publications/{id}/document", 42L)
                .file(file))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data").value("https://cdn.example/uploaded.pdf"));

        verify(getDocumentUploadUrlUseCase).execute(42L, "book.pdf");
        verify(saveDocumentUrlUseCase).execute(42L, "docs/book.pdf");
        verify(saveDocumentUrlUseCase).upload(eq(42L), any());
    }
}
