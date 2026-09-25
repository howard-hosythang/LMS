package com.library.catalog.application;

import com.library.catalog.dto.request.publication.CreatePublicationRequest;

public interface CreatePublicationUseCase {
    Long execute(CreatePublicationRequest request, Long librarianId);
}
