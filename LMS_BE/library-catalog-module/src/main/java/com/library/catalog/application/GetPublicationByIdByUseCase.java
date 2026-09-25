package com.library.catalog.application;

import com.library.catalog.dto.response.publication.PublicationDetailResponse;

public interface GetPublicationByIdByUseCase {

  default PublicationDetailResponse execute(Long publicationId) {
    return execute(publicationId, "vi");
  }

  PublicationDetailResponse execute(Long publicationId, String uiLanguage);
}
