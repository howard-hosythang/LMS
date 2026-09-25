package com.library.catalog.dto.response.publication;

import java.util.List;

public record BookLookupResponse(
    String queryType,
    List<BookSearchItem> results
) {}
