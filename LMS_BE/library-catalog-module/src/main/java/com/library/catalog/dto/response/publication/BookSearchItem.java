package com.library.catalog.dto.response.publication;

import java.util.List;

public record BookSearchItem(
    String isbn,
    String title,
    String subtitle,
    String description,
    String language,
    Integer numberOfPages,
    Integer publicationYear,
    String publisherName,
    List<String> authorNames,
    List<String> categoryNames,
    String coverImageUrl,
    String alternativeCoverUrl,
    String callNumber,
    List<TocEntry> tableOfContents
) {}
