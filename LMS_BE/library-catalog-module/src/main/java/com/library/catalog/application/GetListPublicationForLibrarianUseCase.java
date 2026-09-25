package com.library.catalog.application;

import com.library.catalog.dto.request.publication.PublicationSearchRequest;
import com.library.catalog.dto.response.publication.LibrarianPublicationListResponse;
import com.library.shared.dto.PageResponse;

public interface GetListPublicationForLibrarianUseCase {
    PageResponse<LibrarianPublicationListResponse> execute(PublicationSearchRequest request);
}
