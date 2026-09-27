package com.library.catalog.dto.response.publication;

import java.util.ArrayList;
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
    List<TocEntry> tableOfContents,
    String editionId,
    String isbn10,
    String isbn13,
    String coverSmall,
    String coverMedium,
    String coverLarge,
    List<String> coverUrls
) {
    // Backward-compatible constructor for existing callers
    public BookSearchItem(
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
    ) {
        this(
            isbn,
            title,
            subtitle,
            description,
            language,
            numberOfPages,
            publicationYear,
            publisherName,
            authorNames,
            categoryNames,
            coverImageUrl,
            alternativeCoverUrl,
            callNumber,
            tableOfContents,
            null,
            null,
            null,
            null,
            null,
            coverImageUrl,
            buildCoverUrls(coverImageUrl, alternativeCoverUrl)
        );
    }

    private static List<String> buildCoverUrls(String coverImageUrl, String alternativeCoverUrl) {
        List<String> urls = new ArrayList<>();
        if (coverImageUrl != null && !coverImageUrl.isBlank()) {
            urls.add(coverImageUrl);
        }
        if (alternativeCoverUrl != null && !alternativeCoverUrl.isBlank() && !urls.contains(alternativeCoverUrl)) {
            urls.add(alternativeCoverUrl);
        }
        return urls;
    }
}
