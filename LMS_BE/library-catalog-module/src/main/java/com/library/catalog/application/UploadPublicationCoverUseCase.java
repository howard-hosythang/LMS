package com.library.catalog.application;

import org.springframework.web.multipart.MultipartFile;

public interface UploadPublicationCoverUseCase {
    String execute(Long publicationId, MultipartFile file);
}
