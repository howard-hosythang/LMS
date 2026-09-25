package com.library.catalog.application.impl;

import com.library.catalog.application.UploadPublicationCoverUseCase;
import com.library.catalog.infrastructure.persistence.entity.PublicationEntity;
import com.library.catalog.infrastructure.persistence.repository.PublicationJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class UploadPublicationCoverUseCaseImpl implements UploadPublicationCoverUseCase {

    private final PublicationJpaRepository publicationRepository;
    private final com.library.shared.port.StoragePort storagePort;

    private static final long MAX_SIZE = 5 * 1024 * 1024; // 5MB
    private static final Set<String> ALLOWED_TYPES = Set.of(
        "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    @Override
    @Transactional
    public String execute(Long publicationId, MultipartFile file) {
        // 1. Validate
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (file.getSize() > MAX_SIZE) {
            throw new AppException(ErrorCode.FILE_TOO_LARGE);
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new AppException(ErrorCode.INVALID_FILE_TYPE);
        }

        // 2. Check existence
        PublicationEntity publication = publicationRepository.findById(publicationId)
            .orElseThrow(() -> new AppException(ErrorCode.PUBLICATION_NOT_FOUND));

        // 3. Upload
        String url = storagePort.upload(file, "covers");

        // 4. Update DB
        publication.setCoverImageUrl(url);
        publicationRepository.save(publication);

        log.info("Cover uploaded for publication {}: {}", publicationId, url);
        return url;
    }
}
