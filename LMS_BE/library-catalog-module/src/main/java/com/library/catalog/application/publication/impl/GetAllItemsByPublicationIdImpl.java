package com.library.catalog.application.publication.impl;

import com.library.catalog.application.publication.GetAllItemsByPublicationId;
import com.library.catalog.dto.response.item.ItemsByPublicationIdResponse;
import com.library.catalog.infrastructure.persistence.repository.PublicationJpaRepository;
import com.library.shared.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetAllItemsByPublicationIdImpl implements GetAllItemsByPublicationId {

  private final PublicationJpaRepository publicationJpaRepository;

  @Override
  public PageResponse<ItemsByPublicationIdResponse> execute(Long publicationId, int page,
      int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<ItemsByPublicationIdResponse> items = publicationJpaRepository.findAllItemsByPublicationId(
        publicationId, pageable);
    return PageResponse.from(items);
  }
}
