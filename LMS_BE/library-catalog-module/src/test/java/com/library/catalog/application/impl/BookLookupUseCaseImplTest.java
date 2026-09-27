package com.library.catalog.application.impl;

import com.library.catalog.dto.response.publication.BookLookupResponse;
import com.library.catalog.dto.response.publication.BookSearchItem;
import com.library.catalog.infrastructure.external.GoogleBooksClient;
import com.library.catalog.infrastructure.external.OpenLibraryClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookLookupUseCaseImplTest {

    @Mock
    private GoogleBooksClient googleBooksClient;

    @Mock
    private OpenLibraryClient openLibraryClient;

    @InjectMocks
    private BookLookupUseCaseImpl bookLookupUseCase;

    private BookSearchItem sampleOpenLibItem;
    private BookSearchItem sampleGoogleItem;

    @BeforeEach
    void setUp() {
        sampleOpenLibItem = new BookSearchItem(
            "9780132350884",
            "Clean Code",
            "A Handbook of Agile Software Craftsmanship",
            "Description from OL",
            "English",
            431,
            2008,
            "Prentice Hall",
            List.of("Robert C. Martin"),
            List.of("Software development"),
            "https://covers.openlibrary.org/b/id/15126503-L.jpg",
            "https://covers.openlibrary.org/b/id/15106900-L.jpg",
            null,
            null,
            "OL26222911M",
            "0132350882",
            "9780132350884",
            "https://covers.openlibrary.org/b/id/15126503-S.jpg",
            "https://covers.openlibrary.org/b/id/15126503-M.jpg",
            "https://covers.openlibrary.org/b/id/15126503-L.jpg",
            List.of(
                "https://covers.openlibrary.org/b/id/15126503-L.jpg",
                "https://covers.openlibrary.org/b/id/15106900-L.jpg"
            )
        );

        sampleGoogleItem = new BookSearchItem(
            "9780132350884",
            "Clean Code",
            "A Handbook of Agile Software Craftsmanship",
            "Description from Google",
            "English",
            464,
            2008,
            "Pearson Education",
            List.of("Robert C. Martin"),
            List.of("Computers"),
            "https://books.google.com/thumbnail1.jpg",
            null,
            null,
            null
        );
    }

    @Test
    @DisplayName("execute với query là ISBN định dạng có gạch nối -> nhận diện ISBN và merge covers")
    void testExecuteWithIsbn() {
        when(googleBooksClient.searchByIsbn("9780132350884")).thenReturn(List.of(sampleGoogleItem));
        when(openLibraryClient.lookupByIsbn("9780132350884")).thenReturn(Optional.of(sampleOpenLibItem));

        BookLookupResponse response = bookLookupUseCase.execute("978-0-13-235088-4");

        assertThat(response.queryType()).isEqualTo("ISBN");
        assertThat(response.results()).hasSize(1);

        BookSearchItem result = response.results().get(0);
        assertThat(result.title()).isEqualTo("Clean Code");
        assertThat(result.editionId()).isEqualTo("OL26222911M");
        assertThat(result.isbn10()).isEqualTo("0132350882");
        assertThat(result.isbn13()).isEqualTo("9780132350884");

        // Kiểm tra merge covers: chứa cả covers từ OpenLibrary và Google
        assertThat(result.coverUrls()).contains(
            "https://covers.openlibrary.org/b/id/15126503-L.jpg",
            "https://books.google.com/thumbnail1.jpg"
        );
    }

    @Test
    @DisplayName("execute với query là Edition ID (OL...M) -> nhận diện EDITION")
    void testExecuteWithEditionId() {
        when(openLibraryClient.lookupByEditionId("OL26222911M")).thenReturn(Optional.of(sampleOpenLibItem));

        BookLookupResponse response = bookLookupUseCase.execute("OL26222911M");

        assertThat(response.queryType()).isEqualTo("EDITION");
        assertThat(response.results()).hasSize(1);
        assertThat(response.results().get(0).editionId()).isEqualTo("OL26222911M");
    }

    @Test
    @DisplayName("execute với query là Title -> tìm kiếm theo Title")
    void testExecuteWithTitle() {
        when(googleBooksClient.searchByTitle("Clean Code")).thenReturn(List.of(sampleGoogleItem));
        when(openLibraryClient.searchByTitle("Clean Code")).thenReturn(List.of(sampleOpenLibItem));

        BookLookupResponse response = bookLookupUseCase.execute("Clean Code");

        assertThat(response.queryType()).isEqualTo("TITLE");
        assertThat(response.results()).isNotEmpty();
        assertThat(response.results().get(0).title()).isEqualTo("Clean Code");
    }
}
