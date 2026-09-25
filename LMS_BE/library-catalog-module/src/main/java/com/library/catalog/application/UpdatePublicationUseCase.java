package com.library.catalog.application;

import com.library.catalog.dto.request.publication.UpdatePublicationRequest;

public interface UpdatePublicationUseCase {
    void execute(Long publicationId, UpdatePublicationRequest request, Long librarianId);
}
