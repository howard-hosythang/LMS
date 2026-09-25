package com.library.catalog.application.impl;

import com.library.catalog.application.BookLookupUseCase;
import com.library.catalog.dto.response.publication.BookLookupResponse;
import com.library.catalog.dto.response.publication.BookSearchItem;
import com.library.catalog.infrastructure.external.GoogleBooksClient;
import com.library.catalog.infrastructure.external.OpenLibraryClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookLookupUseCaseImpl implements BookLookupUseCase {

    private final GoogleBooksClient googleBooksClient;
    private final OpenLibraryClient openLibraryClient;

    private static final Pattern ISBN_PATTERN = Pattern.compile("^[\\d\\-]{10,17}$");

    @Override
    public BookLookupResponse execute(String query) {
        String normalized = query.trim();
        String digitsOnly = normalized.replace("-", "");
        boolean isIsbn = ISBN_PATTERN.matcher(normalized).matches()
            && (digitsOnly.length() == 10 || digitsOnly.length() == 13);

        return isIsbn ? lookupByIsbn(digitsOnly) : searchByTitle(normalized);
    }

    private BookLookupResponse lookupByIsbn(String isbn) {
        CompletableFuture<List<BookSearchItem>> googleFuture =
            CompletableFuture.supplyAsync(() -> googleBooksClient.searchByIsbn(isbn));
        CompletableFuture<Optional<BookSearchItem>> openLibFuture =
            CompletableFuture.supplyAsync(() -> openLibraryClient.lookupByIsbn(isbn));

        CompletableFuture.allOf(googleFuture, openLibFuture).join();

        BookSearchItem google = googleFuture.join().stream().findFirst().orElse(null);
        BookSearchItem openLib = openLibFuture.join().orElse(null);
        BookSearchItem merged = mergeIsbnResults(google, openLib);

        return new BookLookupResponse("ISBN", merged == null ? List.of() : List.of(merged));
    }

    private BookLookupResponse searchByTitle(String title) {
        CompletableFuture<List<BookSearchItem>> googleFuture =
            CompletableFuture.supplyAsync(() -> googleBooksClient.searchByTitle(title));
        CompletableFuture<List<BookSearchItem>> openLibFuture =
            CompletableFuture.supplyAsync(() -> openLibraryClient.searchByTitle(title));

        CompletableFuture.allOf(googleFuture, openLibFuture).join();

        List<BookSearchItem> google = googleFuture.join();
        List<BookSearchItem> openLib = openLibFuture.join();

        List<BookSearchItem> merged = new ArrayList<>(google);
        for (BookSearchItem ol : openLib) {
            boolean duplicate = google.stream().anyMatch(g -> titlesMatch(g.title(), ol.title()));
            if (!duplicate) merged.add(ol);
        }

        return new BookLookupResponse("TITLE", merged.stream().limit(7).toList());
    }

    private BookSearchItem mergeIsbnResults(BookSearchItem google, BookSearchItem openLib) {
        if (google == null && openLib == null) return null;
        if (google == null) return openLib;
        if (openLib == null) return google;

        String primaryCover   = coalesce(google.coverImageUrl(), openLib.coverImageUrl());
        String secondaryCover = (google.coverImageUrl() != null && openLib.coverImageUrl() != null
                && !google.coverImageUrl().equals(openLib.coverImageUrl()))
                ? openLib.coverImageUrl() : null;

        return new BookSearchItem(
            coalesce(google.isbn(), openLib.isbn()),
            coalesce(google.title(), openLib.title()),
            coalesce(google.subtitle(), openLib.subtitle()),
            google.description(),
            google.language(),
            coalesce(google.numberOfPages(), openLib.numberOfPages()),
            coalesce(google.publicationYear(), openLib.publicationYear()),
            coalesce(google.publisherName(), openLib.publisherName()),
            !google.authorNames().isEmpty() ? google.authorNames() : openLib.authorNames(),
            !google.categoryNames().isEmpty() ? google.categoryNames() : openLib.categoryNames(),
            primaryCover,
            secondaryCover,
            openLib.callNumber(),
            openLib.tableOfContents()
        );
    }

    private boolean titlesMatch(String t1, String t2) {
        if (t1 == null || t2 == null) return false;
        String a = t1.toLowerCase();
        String b = t2.toLowerCase();
        int len = Math.min(b.length(), 15);
        return a.contains(b.substring(0, len));
    }

    private <T> T coalesce(T a, T b) {
        return a != null ? a : b;
    }
}
