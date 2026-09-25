package com.library.catalog.application.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

import com.library.catalog.dto.response.publication.DocumentUploadUrlResponse;
import com.library.catalog.infrastructure.persistence.entity.PublicationEntity;
import com.library.catalog.infrastructure.persistence.repository.PublicationJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.port.AiPublicationProcessingPort;
import com.library.shared.port.StoragePort;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
@DisplayName("Document upload/save use cases — Unit Tests")
class DocumentUseCaseTest {

    @Mock private PublicationJpaRepository publicationRepository;
    @Mock private StoragePort storagePort;
    @Mock private AiPublicationProcessingPort aiPublicationProcessingPort;
    @Mock private JdbcTemplate jdbcTemplate;

    @InjectMocks private GetDocumentUploadUrlUseCaseImpl getDocumentUploadUrlUseCase;
    @InjectMocks private SaveDocumentUrlUseCaseImpl saveDocumentUrlUseCase;

    @Test
    @DisplayName("generates sanitized 15-minute presigned document upload URL")
    void getDocumentUploadUrl_shouldSanitizeFilenameAndUseExpectedTtl() {
        when(publicationRepository.existsById(42L)).thenReturn(true);
        when(storagePort.generatePresignedPutUrl(anyString(), eq(900L)))
            .thenReturn("https://s3.example/upload");

        DocumentUploadUrlResponse result =
            getDocumentUploadUrlUseCase.execute(42L, "Machine Learning intro.pdf");

        assertThat(result.uploadUrl()).isEqualTo("https://s3.example/upload");
        assertThat(result.s3Key()).startsWith("publications/42/documents/");
        assertThat(result.s3Key()).contains("Machine_Learning_intro.pdf_");
        assertThat(result.s3Key()).endsWith(".pdf");
        verify(storagePort).generatePresignedPutUrl(result.s3Key(), 900L);
    }

    @Test
    @DisplayName("save document URL stores public URL, marks AI queued and triggers AI processing")
    void saveDocumentUrl_shouldPersistUrlAndTriggerAiProcessing() {
        PublicationEntity publication = new PublicationEntity();
        publication.setId(42L);
        publication.setTitle("Clean Code");
        when(publicationRepository.findById(42L)).thenReturn(Optional.of(publication));
        when(storagePort.buildPublicUrl("publications/42/documents/book.pdf"))
            .thenReturn("https://cdn.example/book.pdf");

        String fileUrl = saveDocumentUrlUseCase.execute(42L, "publications/42/documents/book.pdf");

        assertThat(fileUrl).isEqualTo("https://cdn.example/book.pdf");
        assertThat(publication.getFileUrl()).isEqualTo("https://cdn.example/book.pdf");
        verify(publicationRepository).save(publication);
        verify(jdbcTemplate).update(anyString(), eq(42L));
        verify(aiPublicationProcessingPort).processPublication(
            42L,
            "https://cdn.example/book.pdf",
            true
        );
    }

    @Test
    @DisplayName("upload document stores URL, marks AI queued and triggers AI processing")
    void uploadDocument_shouldUploadPersistUrlAndTriggerAiProcessing() {
        PublicationEntity publication = new PublicationEntity();
        publication.setId(42L);
        publication.setTitle("Clean Code");
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "book.pdf",
            "application/pdf",
            "pdf".getBytes()
        );
        when(publicationRepository.findById(42L)).thenReturn(Optional.of(publication));
        when(storagePort.upload(file, "publications/42/documents"))
            .thenReturn("https://cdn.example/book.pdf");

        String fileUrl = saveDocumentUrlUseCase.upload(42L, file);

        assertThat(fileUrl).isEqualTo("https://cdn.example/book.pdf");
        assertThat(publication.getFileUrl()).isEqualTo("https://cdn.example/book.pdf");
        verify(publicationRepository).save(publication);
        verify(jdbcTemplate).update(anyString(), eq(42L));
        verify(aiPublicationProcessingPort).processPublication(
            42L,
            "https://cdn.example/book.pdf",
            true
        );
    }

    @Test
    @DisplayName("document use cases reject missing publication")
    void documentUseCases_shouldRejectMissingPublication() {
        when(publicationRepository.existsById(404L)).thenReturn(false);

        assertThatThrownBy(() -> getDocumentUploadUrlUseCase.execute(404L, "book.pdf"))
            .isInstanceOf(AppException.class)
            .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.PUBLICATION_NOT_FOUND));

        verify(storagePort, never()).generatePresignedPutUrl(anyString(), eq(900L));
    }
}
