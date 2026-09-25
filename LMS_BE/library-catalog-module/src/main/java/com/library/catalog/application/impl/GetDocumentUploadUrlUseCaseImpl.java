package com.library.catalog.application.impl;

import com.library.catalog.application.GetDocumentUploadUrlUseCase;
import com.library.catalog.dto.response.publication.DocumentUploadUrlResponse;
import com.library.catalog.infrastructure.persistence.repository.PublicationJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class GetDocumentUploadUrlUseCaseImpl implements GetDocumentUploadUrlUseCase {

    private static final long PRESIGNED_URL_TTL_SECONDS = 900; // 15 phút

    private final PublicationJpaRepository publicationRepository;
    private final com.library.shared.port.StoragePort storagePort;

    @Override
    public DocumentUploadUrlResponse execute(Long publicationId, String filename) {
        if (!publicationRepository.existsById(publicationId)) {
            throw new AppException(ErrorCode.PUBLICATION_NOT_FOUND);
        }

        String s3Key = buildDocumentKey(publicationId, filename);
        String uploadUrl = storagePort.generatePresignedPutUrl(s3Key, PRESIGNED_URL_TTL_SECONDS);

        log.info("Presigned PUT URL generated for publication={}, key={}", publicationId, s3Key);
        return new DocumentUploadUrlResponse(uploadUrl, s3Key);
    }

    private String buildDocumentKey(Long publicationId, String filename) {
        String safeFilename = (filename != null ? filename : "document")
            .replaceAll("[^a-zA-Z0-9._-]", "_");
        return "publications/" + publicationId + "/documents/" + safeFilename + "_" + UUID.randomUUID() + ".pdf";
    }
}
