package com.library.catalog.application.impl;

import com.library.catalog.application.GetPublicationByIdByUseCase;
import com.library.catalog.application.i18n.MetadataLanguage;
import com.library.catalog.dto.response.publication.PublicationDetailResponse;
import com.library.catalog.infrastructure.persistence.repository.PublicationRepositoryCustom;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetPublicationByIdByUseCaseImpl implements
    GetPublicationByIdByUseCase {

  private final PublicationRepositoryCustom publicationRepository;

  @Override
  public PublicationDetailResponse execute(Long publicationId, String uiLanguage) {
    return publicationRepository
        .findPublicationDetailForLibrarian(publicationId, MetadataLanguage.normalize(uiLanguage))
        .orElseThrow(() -> new AppException(ErrorCode.PUBLICATION_NOT_FOUND));
  }
}
