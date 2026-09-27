package com.library.catalog.application.impl;

import com.library.catalog.application.BookLookupUseCase;
import com.library.catalog.dto.response.publication.BookLookupResponse;
import com.library.catalog.dto.response.publication.BookSearchItem;
import com.library.catalog.infrastructure.external.GoogleBooksClient;
import com.library.catalog.infrastructure.external.OpenLibraryClient;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookLookupUseCaseImpl implements BookLookupUseCase {

    private final GoogleBooksClient googleBooksClient;
    private final OpenLibraryClient openLibraryClient;

    @Override
    public BookLookupResponse execute(String query) {
        String trimmed = query.trim();

        // 1. Kiểm tra ISBN (chuẩn hóa loại bỏ '-', khoảng trắng, hỗ trợ ISBN-10 và ISBN-13)
        String normalizedIsbn = OpenLibraryClient.normalizeIsbn(trimmed);
        if (normalizedIsbn != null) {
            return lookupByIsbn(normalizedIsbn);
        }

        // 2. Kiểm tra Edition ID (ví dụ: OL26222911M hoặc /books/OL26222911M)
        if (isEditionKey(trimmed)) {
            String cleanId = trimmed.replace("/books/", "").trim();
            BookSearchItem item = lookupByEditionId(cleanId);
            return new BookLookupResponse("EDITION", List.of(item));
        }

        // 3. Fallback tìm kiếm theo Title
        return searchByTitle(trimmed);
    }

    @Override
    public BookSearchItem lookupByEditionId(String editionId) {
        String cleanId = editionId.replace("/books/", "").trim();
        return openLibraryClient.lookupByEditionId(cleanId)
            .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND));
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

        List<BookSearchItem> merged = new ArrayList<>(openLib);
        for (BookSearchItem g : google) {
            boolean duplicate = merged.stream().anyMatch(m -> titlesMatch(m.title(), g.title()));
            if (!duplicate) merged.add(g);
        }

        return new BookLookupResponse("TITLE", merged.stream().limit(10).toList());
    }

    private BookSearchItem mergeIsbnResults(BookSearchItem google, BookSearchItem openLib) {
        if (google == null && openLib == null) return null;
        if (google == null) return openLib;
        if (openLib == null) return google;

        // Tổng hợp tất cả covers có thể có từ cả OpenLibrary và GoogleBooks
        List<String> mergedCovers = new ArrayList<>();
        if (openLib.coverUrls() != null) {
            mergedCovers.addAll(openLib.coverUrls());
        }
        if (google.coverImageUrl() != null && !mergedCovers.contains(google.coverImageUrl())) {
            mergedCovers.add(0, google.coverImageUrl());
        }
        if (openLib.coverImageUrl() != null && !mergedCovers.contains(openLib.coverImageUrl())) {
            mergedCovers.add(openLib.coverImageUrl());
        }

        String primaryCover = !mergedCovers.isEmpty() ? mergedCovers.get(0) : null;
        String secondaryCover = mergedCovers.size() > 1 ? mergedCovers.get(1) : null;

        String coverSmall = openLib.coverSmall() != null ? openLib.coverSmall() : primaryCover;
        String coverMedium = openLib.coverMedium() != null ? openLib.coverMedium() : primaryCover;
        String coverLarge = openLib.coverLarge() != null ? openLib.coverLarge() : primaryCover;

        return new BookSearchItem(
            coalesce(google.isbn(), openLib.isbn()),
            coalesce(google.title(), openLib.title()),
            coalesce(google.subtitle(), openLib.subtitle()),
            coalesce(google.description(), openLib.description()),
            coalesce(google.language(), openLib.language()),
            coalesce(google.numberOfPages(), openLib.numberOfPages()),
            coalesce(google.publicationYear(), openLib.publicationYear()),
            coalesce(google.publisherName(), openLib.publisherName()),
            !google.authorNames().isEmpty() ? google.authorNames() : openLib.authorNames(),
            !google.categoryNames().isEmpty() ? google.categoryNames() : openLib.categoryNames(),
            primaryCover,
            secondaryCover,
            openLib.callNumber(),
            openLib.tableOfContents(),
            openLib.editionId(),
            openLib.isbn10(),
            openLib.isbn13(),
            coverSmall,
            coverMedium,
            coverLarge,
            mergedCovers
        );
    }

    private boolean isEditionKey(String q) {
        String clean = q.replace("/books/", "").trim();
        return clean.matches("^OL\\d+M$");
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
