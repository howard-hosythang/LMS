package com.library.catalog.application.impl;

import com.library.catalog.application.SaveDocumentUrlUseCase;
import com.library.catalog.infrastructure.persistence.entity.PublicationEntity;
import com.library.catalog.infrastructure.persistence.repository.PublicationJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class SaveDocumentUrlUseCaseImpl implements SaveDocumentUrlUseCase {

    private static final long MAX_DOCUMENT_SIZE = 100L * 1024L * 1024L;

    private final PublicationJpaRepository publicationRepository;
    private final com.library.shared.port.StoragePort storagePort;
    private final com.library.shared.port.AiPublicationProcessingPort aiPublicationProcessingPort;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public String execute(Long publicationId, String s3Key) {
        PublicationEntity publication = publicationRepository.findById(publicationId)
            .orElseThrow(() -> new AppException(ErrorCode.PUBLICATION_NOT_FOUND));

        String fileUrl = storagePort.buildPublicUrl(s3Key);
        publication.setFileUrl(fileUrl);
        publicationRepository.save(publication);
        markAiQueued(publicationId);

        triggerAiProcessingAfterCommit(publicationId, fileUrl);

        log.info("Document URL saved for publication={}: {}", publicationId, fileUrl);
        return fileUrl;
    }

    @Override
    @Transactional
    public String upload(Long publicationId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (file.getSize() > MAX_DOCUMENT_SIZE) {
            throw new AppException(ErrorCode.DOCUMENT_FILE_TOO_LARGE);
        }
        if (!isSupportedDocument(file)) {
            throw new AppException(ErrorCode.INVALID_DOCUMENT_FILE_TYPE);
        }

        PublicationEntity publication = publicationRepository.findById(publicationId)
            .orElseThrow(() -> new AppException(ErrorCode.PUBLICATION_NOT_FOUND));

        String fileUrl = storagePort.upload(file, "publications/" + publicationId + "/documents");
        publication.setFileUrl(fileUrl);
        publicationRepository.save(publication);
        markAiQueued(publicationId);
        triggerAiProcessingAfterCommit(publicationId, fileUrl);

        log.info("Document uploaded and saved for publication={}: {}", publicationId, fileUrl);
        return fileUrl;
    }

    @Override
    @Transactional
    public void reprocessExistingDocument(Long publicationId) {
        PublicationEntity publication = publicationRepository.findById(publicationId)
            .orElseThrow(() -> new AppException(ErrorCode.PUBLICATION_NOT_FOUND));
        String fileUrl = publication.getFileUrl();
        if (fileUrl == null || fileUrl.isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        markAiQueued(publicationId);
        triggerAiProcessingAfterCommit(publicationId, fileUrl);
        log.info("AI reprocessing queued for publication={}", publicationId);
    }

    @Override
    @Transactional
    public void reprocessExistingDocumentVectors(Long publicationId) {
        PublicationEntity publication = publicationRepository.findById(publicationId)
            .orElseThrow(() -> new AppException(ErrorCode.PUBLICATION_NOT_FOUND));
        String fileUrl = publication.getFileUrl();
        if (fileUrl == null || fileUrl.isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        markAiQueued(publicationId);
        triggerAiVectorizationAfterCommit(publicationId, fileUrl);
        log.info("AI vectorization queued for publication={}", publicationId);
    }

    @Override
    @Transactional
    public void generateExistingDocumentMetadata(Long publicationId) {
        PublicationEntity publication = publicationRepository.findById(publicationId)
            .orElseThrow(() -> new AppException(ErrorCode.PUBLICATION_NOT_FOUND));
        String fileUrl = publication.getFileUrl();
        if (fileUrl == null || fileUrl.isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        markAiQueued(publicationId);
        triggerAiMetadataAfterCommit(publicationId, fileUrl);
        log.info("AI metadata generation queued for publication={}", publicationId);
    }

    private void triggerAiProcessingAfterCommit(Long publicationId, String fileUrl) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            aiPublicationProcessingPort.processPublication(publicationId, fileUrl, true);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                aiPublicationProcessingPort.processPublication(publicationId, fileUrl, true);
            }
        });
    }

    private void triggerAiVectorizationAfterCommit(Long publicationId, String fileUrl) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            aiPublicationProcessingPort.vectorizePublication(publicationId, fileUrl, true);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                aiPublicationProcessingPort.vectorizePublication(publicationId, fileUrl, true);
            }
        });
    }

    private void triggerAiMetadataAfterCommit(Long publicationId, String fileUrl) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            aiPublicationProcessingPort.generatePublicationMetadata(publicationId, fileUrl, true);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                aiPublicationProcessingPort.generatePublicationMetadata(publicationId, fileUrl, true);
            }
        });
    }

    private void markAiQueued(Long publicationId) {
        jdbcTemplate.update(
            """
            INSERT INTO ai_engine.publication_etl_runs (
                publication_id,
                file_hash,
                status,
                error_message,
                chunks_count,
                vectors_count,
                updated_at
            )
            VALUES (?, NULL, 'QUEUED', NULL, 0, 0, CURRENT_TIMESTAMP)
            ON CONFLICT (publication_id)
            DO UPDATE SET
                status = 'QUEUED',
                error_message = NULL,
                chunks_count = COALESCE(
                    NULLIF(ai_engine.publication_etl_runs.chunks_count, 0),
                    (SELECT COUNT(*) FROM ai_engine.publication_vectors WHERE publication_id = EXCLUDED.publication_id),
                    0
                ),
                vectors_count = COALESCE(
                    NULLIF(ai_engine.publication_etl_runs.vectors_count, 0),
                    (SELECT COUNT(*) FROM ai_engine.publication_vectors WHERE publication_id = EXCLUDED.publication_id),
                    0
                ),
                updated_at = CURRENT_TIMESTAMP
            """,
            publicationId
        );
    }

    private boolean isSupportedDocument(MultipartFile file) {
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        return filename.endsWith(".pdf")
            || filename.endsWith(".epub")
            || contentType.equals("application/pdf")
            || contentType.equals("application/epub+zip");
    }
}
