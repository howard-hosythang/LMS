package com.library.catalog.application;

import com.library.catalog.dto.response.publication.BookLookupResponse;
import com.library.catalog.dto.response.publication.BookSearchItem;

public interface BookLookupUseCase {
    BookLookupResponse execute(String query);
    BookSearchItem lookupByEditionId(String editionId);
}
