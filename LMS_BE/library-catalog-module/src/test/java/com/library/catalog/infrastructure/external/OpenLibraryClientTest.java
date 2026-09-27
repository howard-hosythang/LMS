package com.library.catalog.infrastructure.external;

import com.library.catalog.dto.response.publication.BookSearchItem;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class OpenLibraryClientTest {

    @Test
    @DisplayName("normalizeIsbn - loại bỏ ký tự gạch nối, khoảng trắng và chuẩn hóa ISBN-10, ISBN-13")
    void testNormalizeIsbn() {
        // ISBN-13
        assertThat(OpenLibraryClient.normalizeIsbn("978-0-13-235088-4")).isEqualTo("9780132350884");
        assertThat(OpenLibraryClient.normalizeIsbn("  9780132350884 ")).isEqualTo("9780132350884");
        assertThat(OpenLibraryClient.normalizeIsbn("978 0 13 235088 4")).isEqualTo("9780132350884");

        // ISBN-10
        assertThat(OpenLibraryClient.normalizeIsbn("0-13-235088-2")).isEqualTo("0132350882");
        assertThat(OpenLibraryClient.normalizeIsbn("0-8044-2957-X")).isEqualTo("080442957X");
        assertThat(OpenLibraryClient.normalizeIsbn("080442957x")).isEqualTo("080442957X");

        // Invalid
        assertThat(OpenLibraryClient.normalizeIsbn(null)).isNull();
        assertThat(OpenLibraryClient.normalizeIsbn("123")).isNull();
        assertThat(OpenLibraryClient.normalizeIsbn("abcdefg")).isNull();
    }
}
