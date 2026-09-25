package com.library.catalog.application;

import com.library.catalog.dto.response.publication.DocumentUploadUrlResponse;

public interface GetDocumentUploadUrlUseCase {
    DocumentUploadUrlResponse execute(Long publicationId, String filename);
}
