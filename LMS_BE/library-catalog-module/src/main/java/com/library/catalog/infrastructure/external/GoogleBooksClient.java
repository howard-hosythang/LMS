package com.library.catalog.infrastructure.external;

import com.library.catalog.dto.response.publication.BookSearchItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

@Slf4j
@Component
public class GoogleBooksClient {

    private final String apiKey;
    private final RestClient restClient;

    public GoogleBooksClient(
        @Value("${google.books.api-key:}") String apiKey,
        RestClient.Builder builder
    ) {
        this.apiKey = apiKey;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(5000);
        this.restClient = builder.requestFactory(factory).build();
    }

    public List<BookSearchItem> searchByIsbn(String isbn) {
        return withRetry(
            () -> parseItems(restClient.get().uri(buildUrl("isbn:" + isbn, 1)).retrieve().body(Map.class), 1),
            List.of(),
            "ISBN=" + isbn
        );
    }

    public List<BookSearchItem> searchByTitle(String title) {
        return withRetry(
            () -> parseItems(restClient.get().uri(buildUrl("intitle:" + title.replace(" ", "+"), 5)).retrieve().body(Map.class), 5),
            List.of(),
            "title=" + title
        );
    }

    private <T> T withRetry(Supplier<T> call, T fallback, String context) {
        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                return call.get();
            } catch (Exception e) {
                if (attempt < 2) {
                    log.warn("Google Books failed [{}] attempt {}, retrying in 500ms: {}", context, attempt, e.getMessage());
                    try { Thread.sleep(500); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
                } else {
                    log.warn("Google Books failed [{}] after 2 attempts: {}", context, e.getMessage());
                }
            }
        }
        return fallback;
    }

    private String buildUrl(String query, int maxResults) {
        String url = "https://www.googleapis.com/books/v1/volumes?q=" + query + "&maxResults=" + maxResults;
        if (!apiKey.isBlank()) url += "&key=" + apiKey;
        return url;
    }

    @SuppressWarnings("unchecked")
    private List<BookSearchItem> parseItems(Map<?, ?> response, int limit) {
        if (response == null) return List.of();
        List<Map<String, Object>> items = (List<Map<String, Object>>) response.get("items");
        if (items == null || items.isEmpty()) return List.of();

        List<BookSearchItem> results = new ArrayList<>();
        for (int i = 0; i < Math.min(items.size(), limit); i++) {
            Map<String, Object> volumeInfo = (Map<String, Object>) items.get(i).get("volumeInfo");
            if (volumeInfo == null) continue;
            results.add(parseVolumeInfo(volumeInfo));
        }
        return results;
    }

    @SuppressWarnings("unchecked")
    private BookSearchItem parseVolumeInfo(Map<String, Object> info) {
        String isbn = extractIsbn((List<Map<String, Object>>) info.get("industryIdentifiers"));
        String title = (String) info.get("title");
        String subtitle = (String) info.get("subtitle");
        String description = (String) info.get("description");
        String language = mapLanguage((String) info.get("language"));
        Integer pages = (Integer) info.get("pageCount");
        Integer year = parseYear((String) info.get("publishedDate"));
        String publisher = (String) info.get("publisher");
        List<String> authors = (List<String>) info.getOrDefault("authors", List.of());
        List<String> categories = (List<String>) info.getOrDefault("categories", List.of());
        String coverUrl = extractCover((Map<String, Object>) info.get("imageLinks"));
        return new BookSearchItem(isbn, title, subtitle, description, language,
            pages, year, publisher, authors, categories, coverUrl, null, null, null);
    }

    private String extractIsbn(List<Map<String, Object>> identifiers) {
        if (identifiers == null) return null;
        return identifiers.stream()
            .filter(id -> "ISBN_13".equals(id.get("type")))
            .map(id -> (String) id.get("identifier"))
            .findFirst()
            .orElseGet(() -> identifiers.stream()
                .filter(id -> "ISBN_10".equals(id.get("type")))
                .map(id -> (String) id.get("identifier"))
                .findFirst().orElse(null));
    }

    private String extractCover(Map<String, Object> imageLinks) {
        if (imageLinks == null) return null;
        String thumbnail = (String) imageLinks.get("thumbnail");
        if (thumbnail == null) return null;
        return thumbnail.replace("zoom=1", "zoom=3").replace("http://", "https://");
    }

    private Integer parseYear(String publishedDate) {
        if (publishedDate == null || publishedDate.length() < 4) return null;
        try { return Integer.parseInt(publishedDate.substring(0, 4)); }
        catch (NumberFormatException e) { return null; }
    }

    private String mapLanguage(String code) {
        if (code == null) return null;
        return switch (code) {
            case "vi" -> "Vietnamese";
            case "en" -> "English";
            default -> null;
        };
    }
}
