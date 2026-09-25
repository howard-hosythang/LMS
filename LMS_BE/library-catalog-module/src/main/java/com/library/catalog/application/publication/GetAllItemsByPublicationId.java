package com.library.catalog.application.publication;

import com.library.catalog.dto.response.item.ItemsByPublicationIdResponse;
import com.library.shared.dto.PageResponse;

public interface GetAllItemsByPublicationId {

  PageResponse<ItemsByPublicationIdResponse> execute(Long publicationId, int page, int size);
}
