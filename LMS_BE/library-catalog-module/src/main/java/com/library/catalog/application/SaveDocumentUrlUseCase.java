package com.library.catalog.application;

import org.springframework.web.multipart.MultipartFile;

public interface SaveDocumentUrlUseCase {
    String execute(Long publicationId, String s3Key);
    String upload(Long publicationId, MultipartFile file);
    void reprocessExistingDocument(Long publicationId);
    void reprocessExistingDocumentVectors(Long publicationId);
    void generateExistingDocumentMetadata(Long publicationId);
}
