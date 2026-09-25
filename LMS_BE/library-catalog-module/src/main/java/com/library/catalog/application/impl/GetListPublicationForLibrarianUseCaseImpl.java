package com.library.catalog.application.impl;

import com.library.catalog.application.GetListPublicationForLibrarianUseCase;
import com.library.catalog.dto.request.publication.PublicationSearchRequest;
import com.library.catalog.dto.response.publication.LibrarianPublicationListResponse;
import com.library.catalog.infrastructure.persistence.repository.PublicationRepositoryCustom;
import com.library.shared.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class GetListPublicationForLibrarianUseCaseImpl implements GetListPublicationForLibrarianUseCase {
    private final PublicationRepositoryCustom publicationRepositoryCustom;


    @Override
    public PageResponse<LibrarianPublicationListResponse> execute(PublicationSearchRequest request) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(request.getSortDir()) ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(
                request.getPage(),
                request.getSize(),
                Sort.by(direction, request.getSortBy())
        );

        Page<LibrarianPublicationListResponse> publicationsForLibrarian = publicationRepositoryCustom.findPublicationsForLibrarian(
                request.getKeyword(),
                request.getCategoryId(),
                request.getYear(),
                request.getHasItems(),
                pageable
        );

        return PageResponse.from(publicationsForLibrarian);
    }
}
