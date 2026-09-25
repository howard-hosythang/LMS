package com.library.catalog.infrastructure.external;

import com.library.catalog.dto.response.publication.BookSearchItem;
import com.library.catalog.dto.response.publication.TocEntry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
public class OpenLibraryClient {

    private final RestClient restClient;

    public OpenLibraryClient(RestClient.Builder builder) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(5000);
        this.restClient = builder.requestFactory(factory).build();
    }

    public Optional<BookSearchItem> lookupByIsbn(String isbn) {
        try {
            String url = "https://openlibrary.org/api/books?bibkeys=ISBN:" + isbn + "&format=json&jscmd=data";
            Map<?, ?> response = restClient.get().uri(url).retrieve().body(Map.class);
            if (response == null) return Optional.empty();
            @SuppressWarnings("unchecked")
            Map<String, Object> book = (Map<String, Object>) response.get("ISBN:" + isbn);
            if (book == null) return Optional.empty();
            return Optional.of(parseBook(isbn, book));
        } catch (Exception e) {
            log.warn("Open Library ISBN lookup failed for {}: {}", isbn, e.getMessage());
            return Optional.empty();
        }
    }

    public List<BookSearchItem> searchByTitle(String title) {
        try {
            String url = "https://openlibrary.org/search.json?title=" + title.replace(" ", "+") + "&limit=5";
            Map<?, ?> response = restClient.get().uri(url).retrieve().body(Map.class);
            if (response == null) return List.of();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> docs = (List<Map<String, Object>>) response.get("docs");
            if (docs == null) return List.of();
            List<BookSearchItem> results = new ArrayList<>();
            for (Map<String, Object> doc : docs) {
                BookSearchItem item = parseSearchDoc(doc);
                if (item != null) results.add(item);
            }
            return results;
        } catch (Exception e) {
            log.warn("Open Library title search failed for '{}': {}", title, e.getMessage());
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private BookSearchItem parseBook(String isbn, Map<String, Object> book) {
        String title = (String) book.get("title");
        String subtitle = (String) book.get("subtitle");

        List<Map<String, Object>> authorsRaw = (List<Map<String, Object>>) book.get("authors");
        List<String> authors = authorsRaw == null ? List.of() :
            authorsRaw.stream().map(a -> (String) a.get("name")).filter(n -> n != null).toList();

        List<Map<String, Object>> publishers = (List<Map<String, Object>>) book.get("publishers");
        String publisher = publishers != null && !publishers.isEmpty() ? (String) publishers.get(0).get("name") : null;

        Integer year = parseYear((String) book.get("publish_date"));
        Integer pages = (Integer) book.get("number_of_pages");

        List<Map<String, Object>> subjects = (List<Map<String, Object>>) book.get("subjects");
        List<String> categories = subjects == null ? List.of() :
            subjects.stream().map(s -> (String) s.get("name")).filter(n -> n != null).limit(5).toList();

        Map<String, Object> cover = (Map<String, Object>) book.get("cover");
        String coverUrl = cover != null ? (String) cover.get("large") : null;

        List<String> dewey = (List<String>) book.get("dewey_decimal_class");
        String callNumber = dewey != null && !dewey.isEmpty() ? dewey.get(0) : null;

        List<Map<String, Object>> tocRaw = (List<Map<String, Object>>) book.get("table_of_contents");
        List<TocEntry> toc = null;
        if (tocRaw != null && !tocRaw.isEmpty()) {
            toc = tocRaw.stream().map(t -> {
                Object lvl = t.get("level");
                Integer level = lvl instanceof Integer i ? i : (lvl instanceof String s ? parseIntSafe(s) : null);
                return new TocEntry(level, (String) t.get("title"), (String) t.get("pagenum"));
            }).filter(t -> t.title() != null).toList();
        }

        return new BookSearchItem(isbn, title, subtitle, null, null, pages, year, publisher,
            authors, categories, coverUrl, null, callNumber, toc);
    }

    @SuppressWarnings("unchecked")
    private BookSearchItem parseSearchDoc(Map<String, Object> doc) {
        String title = (String) doc.get("title");
        if (title == null) return null;

        List<String> authors = (List<String>) doc.getOrDefault("author_name", List.of());
        List<String> publishers = (List<String>) doc.get("publisher");
        String publisher = publishers != null && !publishers.isEmpty() ? publishers.get(0) : null;

        Integer year = doc.get("first_publish_year") instanceof Integer y ? y : null;
        Integer pages = doc.get("number_of_pages_median") instanceof Integer p ? p : null;

        List<String> isbns = (List<String>) doc.get("isbn");
        String isbn = isbns != null && !isbns.isEmpty() ? isbns.get(0) : null;

        List<String> subjects = (List<String>) doc.get("subject");
        List<String> categories = subjects != null ? subjects.stream().limit(3).toList() : List.of();

        Integer coverId = doc.get("cover_i") instanceof Integer c ? c : null;
        String coverUrl = coverId != null ? "https://covers.openlibrary.org/b/id/" + coverId + "-L.jpg" : null;

        List<String> langs = (List<String>) doc.get("language");
        String language = langs == null ? null :
            langs.contains("vie") ? "Vietnamese" : langs.contains("eng") ? "English" : null;

        return new BookSearchItem(isbn, title, null, null, language, pages, year, publisher,
            authors, categories, coverUrl, null, null, null);
    }

    private Integer parseYear(String publishDate) {
        if (publishDate == null || publishDate.isBlank()) return null;
        String digits = publishDate.replaceAll("\\D", "");
        if (digits.length() < 4) return null;
        try { return Integer.parseInt(digits.substring(0, 4)); }
        catch (NumberFormatException e) { return null; }
    }

    private Integer parseIntSafe(String s) {
        try { return Integer.parseInt(s.trim()); }
        catch (Exception e) { return null; }
    }
}
