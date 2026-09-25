package com.library.catalog.application;

import com.library.catalog.dto.response.publication.BookLookupResponse;

public interface BookLookupUseCase {
    BookLookupResponse execute(String query);
}
