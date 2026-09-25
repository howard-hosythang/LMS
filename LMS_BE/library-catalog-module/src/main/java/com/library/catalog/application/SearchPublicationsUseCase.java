package com.library.catalog.application;

import com.library.catalog.dto.request.publication.PublicSearchRequest;
import com.library.catalog.dto.response.publication.PublicSearchResult;
import com.library.shared.dto.PageResponse;

public interface SearchPublicationsUseCase {
    default PageResponse<PublicSearchResult> execute(PublicSearchRequest request) {
        return execute(request, "vi");
    }

    PageResponse<PublicSearchResult> execute(PublicSearchRequest request, String uiLanguage);
}
