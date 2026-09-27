package com.library.catalog.infrastructure.external;

import com.library.catalog.dto.response.publication.BookSearchItem;
import com.library.catalog.dto.response.publication.TocEntry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class OpenLibraryClient {

    private final RestClient restClient;
    private final Map<String, String> authorNameCache = new ConcurrentHashMap<>();

    public OpenLibraryClient(RestClient.Builder builder) {
        // Cấu hình HTTP client hỗ trợ tự động follow redirects (301, 302, 307, 308)
        HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(5))
            .build();

        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofSeconds(10));

        this.restClient = builder
            .requestFactory(factory)
            .build();
    }

    /**
     * Normalize ISBN: loại bỏ gạch ngang, khoảng trắng, ký tự thừa.
     * Hỗ trợ cả ISBN-10 (có thể kết thúc bằng X) và ISBN-13.
     */
    public static String normalizeIsbn(String rawIsbn) {
        if (rawIsbn == null) return null;
        String clean = rawIsbn.replaceAll("[^0-9Xx]", "").toUpperCase();
        if (clean.length() == 10 || clean.length() == 13) {
            return clean;
        }
        return null;
    }

    /**
     * Lookup theo ISBN.
     * Open Library tự động redirect từ /isbn/{ISBN}.json sang /books/{editionId}.json.
     * RestClient tự động follow redirect và trả về full Edition JSON.
     */
    public Optional<BookSearchItem> lookupByIsbn(String rawIsbn) {
        String isbn = normalizeIsbn(rawIsbn);
        if (isbn == null) {
            log.warn("Invalid ISBN format for lookup: {}", rawIsbn);
            return Optional.empty();
        }
        try {
            String url = "https://openlibrary.org/isbn/" + isbn + ".json";
            @SuppressWarnings("unchecked")
            Map<String, Object> edition = restClient.get()
                .uri(url)
                .retrieve()
                .body(Map.class);

            if (edition == null || edition.isEmpty()) {
                return Optional.empty();
            }

            return Optional.of(parseEditionJson(edition, isbn));
        } catch (Exception e) {
            log.warn("Open Library ISBN lookup failed for {}: {}", isbn, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Lookup trực tiếp theo Edition ID (/books/{editionId}.json) để lấy full Edition JSON.
     */
    public Optional<BookSearchItem> lookupByEditionId(String editionId) {
        if (editionId == null || editionId.isBlank()) return Optional.empty();
        String cleanId = cleanKey(editionId);
        try {
            String url = "https://openlibrary.org/books/" + cleanId + ".json";
            @SuppressWarnings("unchecked")
            Map<String, Object> edition = restClient.get()
                .uri(url)
                .retrieve()
                .body(Map.class);

            if (edition == null || edition.isEmpty()) {
                return Optional.empty();
            }

            return Optional.of(parseEditionJson(edition, null));
        } catch (Exception e) {
            log.warn("Open Library edition lookup failed for {}: {}", cleanId, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Tìm kiếm sách theo Title sử dụng Search API.
     * Tìm các Edition candidate thực tế (từ editions.docs hoặc edition_key),
     * không chỉ lấy Work ID rồi coi đó là Edition.
     */
    public List<BookSearchItem> searchByTitle(String title) {
        if (title == null || title.isBlank()) return List.of();
        try {
            String encoded = URLEncoder.encode(title.trim(), StandardCharsets.UTF_8);
            String url = "https://openlibrary.org/search.json?title=" + encoded
                + "&fields=key,title,subtitle,author_name,editions,edition_key,cover_i,isbn,publisher,publish_year,language&limit=8";

            Map<?, ?> response = restClient.get()
                .uri(url)
                .retrieve()
                .body(Map.class);

            if (response == null) return List.of();

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> docs = (List<Map<String, Object>>) response.get("docs");
            if (docs == null || docs.isEmpty()) return List.of();

            List<BookSearchItem> candidates = new ArrayList<>();
            for (Map<String, Object> doc : docs) {
                List<BookSearchItem> docCandidates = parseSearchDocToCandidates(doc);
                candidates.addAll(docCandidates);
                if (candidates.size() >= 10) break;
            }
            return candidates;
        } catch (Exception e) {
            log.warn("Open Library title search failed for '{}': {}", title, e.getMessage());
            return List.of();
        }
    }

    /**
     * Parse full Edition JSON nhận được từ /isbn/{isbn}.json hoặc /books/{editionId}.json.
     */
    @SuppressWarnings("unchecked")
    private BookSearchItem parseEditionJson(Map<String, Object> edition, String fallbackIsbn) {
        String key = (String) edition.get("key");
        String editionId = cleanKey(key);

        String title = (String) edition.get("title");
        String subtitle = (String) edition.get("subtitle");

        // ISBN 10 & 13
        List<String> isbn10List = extractStringList(edition.get("isbn_10"));
        List<String> isbn13List = extractStringList(edition.get("isbn_13"));
        String isbn10 = !isbn10List.isEmpty() ? isbn10List.get(0) : null;
        String isbn13 = !isbn13List.isEmpty() ? isbn13List.get(0) : null;
        String finalIsbn = isbn13 != null ? isbn13 : (isbn10 != null ? isbn10 : fallbackIsbn);

        // Năm xuất bản & số trang
        Integer year = parseYear((String) edition.get("publish_date"));
        Integer pages = parseInteger(edition.get("number_of_pages"));

        // Nhà xuất bản
        String publisher = extractPublisher(edition.get("publishers"));

        // Ngôn ngữ
        String language = extractLanguage(edition.get("languages"));

        // Dewey / Call number
        String callNumber = extractCallNumber(edition);

        // Table of contents
        List<TocEntry> toc = parseTableOfContents(edition.get("table_of_contents"));

        // Description
        String description = extractDescription(edition.get("description"));

        // Tác giả & Categories (Subjects)
        List<String> authors = extractAuthorsFromEdition(edition.get("authors"));
        List<String> categories = extractStringList(edition.get("subjects"));

        // Nếu Edition thiếu tác giả, mô tả hoặc categories, làm giàu dữ liệu từ Work API
        List<Map<String, Object>> works = (List<Map<String, Object>>) edition.get("works");
        if (works != null && !works.isEmpty()) {
            Map<String, Object> workRef = works.get(0);
            if (description == null) {
                description = enrichDescriptionFromWork(workRef);
            }
            if (authors.isEmpty() || categories.isEmpty()) {
                enrichAuthorsAndCategoriesFromWork(workRef, authors, categories);
            }
        }

        // Covers resolution: S, M, L và danh sách covers phong phú cho thủ thư lựa chọn
        List<?> coversRaw = (List<?>) edition.get("covers");
        CoverInfo coverInfo = resolveCovers(coversRaw, finalIsbn);

        return new BookSearchItem(
            finalIsbn,
            title,
            subtitle,
            description,
            language,
            pages,
            year,
            publisher,
            authors,
            categories.stream().limit(5).toList(),
            coverInfo.coverLarge(),
            coverInfo.coverUrls().size() > 1 ? coverInfo.coverUrls().get(1) : null,
            callNumber,
            toc,
            editionId,
            isbn10,
            isbn13,
            coverInfo.coverSmall(),
            coverInfo.coverMedium(),
            coverInfo.coverLarge(),
            coverInfo.coverUrls()
        );
    }

    /**
     * Trích xuất các Edition candidates từ một search doc.
     */
    @SuppressWarnings("unchecked")
    private List<BookSearchItem> parseSearchDocToCandidates(Map<String, Object> doc) {
        List<BookSearchItem> candidates = new ArrayList<>();
        String workTitle = (String) doc.get("title");
        String workSubtitle = (String) doc.get("subtitle");
        List<String> authors = extractStringList(doc.get("author_name"));
        Number workCoverId = doc.get("cover_i") instanceof Number n ? n : null;
        List<String> docIsbns = extractStringList(doc.get("isbn"));

        // 1. Tìm trong editions.docs con
        Object editionsObj = doc.get("editions");
        if (editionsObj instanceof Map<?, ?> editionsMap) {
            List<?> subDocs = (List<?>) editionsMap.get("docs");
            if (subDocs != null && !subDocs.isEmpty()) {
                for (Object item : subDocs) {
                    if (item instanceof Map<?, ?> edMap) {
                        BookSearchItem candidate = parseSingleEditionDoc(
                            (Map<String, Object>) edMap, workTitle, workSubtitle, authors, workCoverId, docIsbns
                        );
                        if (candidate != null) candidates.add(candidate);
                    }
                }
            }
        }

        // 2. Nếu không có editions.docs con, dùng top edition_key
        if (candidates.isEmpty()) {
            List<String> editionKeys = extractStringList(doc.get("edition_key"));
            if (!editionKeys.isEmpty()) {
                int limit = Math.min(editionKeys.size(), 2);
                for (int i = 0; i < limit; i++) {
                    String edKey = cleanKey(editionKeys.get(i));
                    String isbn10 = findFirstIsbnByLength(docIsbns, 10);
                    String isbn13 = findFirstIsbnByLength(docIsbns, 13);
                    String primaryIsbn = isbn13 != null ? isbn13 : (isbn10 != null ? isbn10 : (!docIsbns.isEmpty() ? docIsbns.get(0) : null));

                    String publisher = extractFirstString(doc.get("publisher"));
                    Integer year = extractFirstYear(doc.get("publish_year"));
                    String language = extractLanguageFromCodes(extractStringList(doc.get("language")));
                    CoverInfo coverInfo = resolveCoversFromCoverId(workCoverId, primaryIsbn);

                    candidates.add(new BookSearchItem(
                        primaryIsbn,
                        workTitle,
                        workSubtitle,
                        null,
                        language,
                        parseInteger(doc.get("number_of_pages_median")),
                        year,
                        publisher,
                        authors,
                        List.of(),
                        coverInfo.coverLarge(),
                        coverInfo.coverUrls().size() > 1 ? coverInfo.coverUrls().get(1) : null,
                        null,
                        null,
                        edKey,
                        isbn10,
                        isbn13,
                        coverInfo.coverSmall(),
                        coverInfo.coverMedium(),
                        coverInfo.coverLarge(),
                        coverInfo.coverUrls()
                    ));
                }
            }
        }

        return candidates;
    }

    private BookSearchItem parseSingleEditionDoc(
        Map<String, Object> edMap,
        String fallbackTitle,
        String fallbackSubtitle,
        List<String> fallbackAuthors,
        Number fallbackCoverId,
        List<String> fallbackIsbns
    ) {
        String key = (String) edMap.get("key");
        String editionId = cleanKey(key);
        if (editionId == null || editionId.isBlank()) return null;

        String title = edMap.get("title") instanceof String s && !s.isBlank() ? s : fallbackTitle;
        String subtitle = edMap.get("subtitle") instanceof String s ? s : fallbackSubtitle;

        List<String> isbns = extractStringList(edMap.get("isbn"));
        if (isbns.isEmpty()) isbns = fallbackIsbns;
        String isbn10 = findFirstIsbnByLength(isbns, 10);
        String isbn13 = findFirstIsbnByLength(isbns, 13);
        String primaryIsbn = isbn13 != null ? isbn13 : (isbn10 != null ? isbn10 : (!isbns.isEmpty() ? isbns.get(0) : null));

        String publisher = extractFirstString(edMap.get("publisher"));
        Integer year = extractFirstYear(edMap.get("publish_year"));
        String language = extractLanguageFromCodes(extractStringList(edMap.get("language")));

        Number coverId = edMap.get("cover_i") instanceof Number n ? n : fallbackCoverId;
        CoverInfo coverInfo = resolveCoversFromCoverId(coverId, primaryIsbn);

        return new BookSearchItem(
            primaryIsbn,
            title,
            subtitle,
            null,
            language,
            null,
            year,
            publisher,
            fallbackAuthors,
            List.of(),
            coverInfo.coverLarge(),
            coverInfo.coverUrls().size() > 1 ? coverInfo.coverUrls().get(1) : null,
            null,
            null,
            editionId,
            isbn10,
            isbn13,
            coverInfo.coverSmall(),
            coverInfo.coverMedium(),
            coverInfo.coverLarge(),
            coverInfo.coverUrls()
        );
    }

    /**
     * Tạo thông tin Cover (Small, Medium, Large, danh sách coverUrls).
     */
    private CoverInfo resolveCovers(List<?> coversRaw, String fallbackIsbn) {
        List<String> urls = new ArrayList<>();
        if (coversRaw != null) {
            for (Object c : coversRaw) {
                if (c instanceof Number n && n.longValue() > 0) {
                    urls.add("https://covers.openlibrary.org/b/id/" + n.longValue() + "-L.jpg");
                }
            }
        }

        if (urls.isEmpty() && fallbackIsbn != null && !fallbackIsbn.isBlank()) {
            urls.add("https://covers.openlibrary.org/b/isbn/" + fallbackIsbn + "-L.jpg");
        }

        if (urls.isEmpty()) {
            return new CoverInfo(null, null, null, List.of());
        }

        String firstLarge = urls.get(0);
        String small = firstLarge.replace("-L.jpg", "-S.jpg");
        String medium = firstLarge.replace("-L.jpg", "-M.jpg");

        return new CoverInfo(small, medium, firstLarge, Collections.unmodifiableList(urls));
    }

    private CoverInfo resolveCoversFromCoverId(Number coverId, String fallbackIsbn) {
        if (coverId != null && coverId.longValue() > 0) {
            long id = coverId.longValue();
            String small = "https://covers.openlibrary.org/b/id/" + id + "-S.jpg";
            String medium = "https://covers.openlibrary.org/b/id/" + id + "-M.jpg";
            String large = "https://covers.openlibrary.org/b/id/" + id + "-L.jpg";

            List<String> urls = new ArrayList<>();
            urls.add(large);
            if (fallbackIsbn != null && !fallbackIsbn.isBlank()) {
                urls.add("https://covers.openlibrary.org/b/isbn/" + fallbackIsbn + "-L.jpg");
            }
            return new CoverInfo(small, medium, large, urls);
        }
        return resolveCovers(null, fallbackIsbn);
    }

    private String enrichDescriptionFromWork(Map<String, Object> workRef) {
        String workKey = (String) workRef.get("key");
        if (workKey == null || workKey.isBlank()) return null;
        try {
            String url = "https://openlibrary.org" + workKey + ".json";
            Map<?, ?> work = restClient.get().uri(url).retrieve().body(Map.class);
            if (work != null) {
                return extractDescription(work.get("description"));
            }
        } catch (Exception e) {
            log.debug("Enrich description from work {} failed: {}", workKey, e.getMessage());
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private void enrichAuthorsAndCategoriesFromWork(
        Map<String, Object> workRef,
        List<String> authors,
        List<String> categories
    ) {
        String workKey = (String) workRef.get("key");
        if (workKey == null || workKey.isBlank()) return;

        try {
            String url = "https://openlibrary.org" + workKey + ".json";
            Map<String, Object> work = restClient.get().uri(url).retrieve().body(Map.class);
            if (work == null) return;

            // Categories từ subjects
            if (categories.isEmpty()) {
                List<String> subjects = extractStringList(work.get("subjects"));
                categories.addAll(subjects);
            }

            // Authors nếu thiếu
            if (authors.isEmpty()) {
                List<Map<String, Object>> workAuthors = (List<Map<String, Object>>) work.get("authors");
                if (workAuthors != null) {
                    for (Map<String, Object> wa : workAuthors) {
                        Map<String, Object> authorObj = (Map<String, Object>) wa.get("author");
                        String aKey = authorObj != null ? (String) authorObj.get("key") : null;
                        if (aKey != null) {
                            String name = fetchAuthorName(aKey);
                            if (name != null && !authors.contains(name)) {
                                authors.add(name);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Enrich from work {} failed: {}", workKey, e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> extractAuthorsFromEdition(Object authorsRaw) {
        List<String> names = new ArrayList<>();
        if (!(authorsRaw instanceof List<?> list)) return names;

        for (Object item : list) {
            if (item instanceof Map<?, ?> m) {
                String name = (String) m.get("name");
                if (name != null && !name.isBlank()) {
                    names.add(name.trim());
                } else {
                    String aKey = (String) m.get("key");
                    if (aKey != null) {
                        String fetched = fetchAuthorName(aKey);
                        if (fetched != null) names.add(fetched);
                    }
                }
            }
        }
        return names;
    }

    private String fetchAuthorName(String authorKey) {
        String clean = cleanKey(authorKey);
        if (clean == null) return null;
        return authorNameCache.computeIfAbsent(clean, key -> {
            try {
                String url = "https://openlibrary.org/authors/" + key + ".json";
                Map<?, ?> author = restClient.get().uri(url).retrieve().body(Map.class);
                if (author != null && author.get("name") instanceof String s) {
                    return s.trim();
                }
            } catch (Exception e) {
                log.debug("Fetch author name for {} failed: {}", key, e.getMessage());
            }
            return null;
        });
    }

    private String extractPublisher(Object publishersObj) {
        if (publishersObj instanceof List<?> list && !list.isEmpty()) {
            Object first = list.get(0);
            if (first instanceof String s && !s.isBlank()) return s.trim();
            if (first instanceof Map<?, ?> m && m.get("name") instanceof String s && !s.isBlank()) return s.trim();
        }
        return null;
    }

    private String extractDescription(Object descObj) {
        if (descObj instanceof String s) return s;
        if (descObj instanceof Map<?, ?> m && m.get("value") instanceof String s) return s;
        return null;
    }

    @SuppressWarnings("unchecked")
    private String extractLanguage(Object languagesObj) {
        if (languagesObj instanceof List<?> list && !list.isEmpty()) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> m && m.get("key") instanceof String key) {
                    String lang = mapLanguageCode(cleanKey(key));
                    if (lang != null) return lang;
                }
            }
        }
        return null;
    }

    private String extractLanguageFromCodes(List<String> codes) {
        if (codes == null || codes.isEmpty()) return null;
        for (String c : codes) {
            String mapped = mapLanguageCode(c);
            if (mapped != null) return mapped;
        }
        return null;
    }

    private String mapLanguageCode(String code) {
        if (code == null) return null;
        String lower = code.toLowerCase().trim();
        return switch (lower) {
            case "eng", "en" -> "English";
            case "vie", "vi" -> "Vietnamese";
            case "fre", "fra", "fr" -> "French";
            case "ger", "deu", "de" -> "German";
            case "spa", "es" -> "Spanish";
            case "jpn", "ja" -> "Japanese";
            case "chi", "zho", "zh" -> "Chinese";
            case "kor", "ko" -> "Korean";
            case "rus", "ru" -> "Russian";
            default -> null;
        };
    }

    @SuppressWarnings("unchecked")
    private String extractCallNumber(Map<String, Object> edition) {
        List<String> dewey = extractStringList(edition.get("dewey_decimal_class"));
        if (!dewey.isEmpty()) return dewey.get(0);

        List<String> lc = extractStringList(edition.get("lc_classifications"));
        if (!lc.isEmpty()) return lc.get(0);

        return null;
    }

    @SuppressWarnings("unchecked")
    private List<TocEntry> parseTableOfContents(Object tocRaw) {
        if (!(tocRaw instanceof List<?> list) || list.isEmpty()) return null;
        List<TocEntry> toc = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Map<?, ?> m) {
                String title = (String) m.get("title");
                if (title != null && !title.isBlank()) {
                    Object lvl = m.get("level");
                    Integer level = lvl instanceof Number n ? n.intValue() :
                        (lvl instanceof String s ? parseInteger(s) : null);
                    Object pg = m.get("pagenum");
                    String pagenum = pg != null ? String.valueOf(pg) : null;
                    toc.add(new TocEntry(level, title, pagenum));
                }
            }
        }
        return toc.isEmpty() ? null : toc;
    }

    private List<String> extractStringList(Object obj) {
        if (!(obj instanceof List<?> list)) return List.of();
        List<String> result = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof String s && !s.isBlank()) {
                result.add(s.trim());
            }
        }
        return result;
    }

    private String extractFirstString(Object obj) {
        List<String> list = extractStringList(obj);
        return !list.isEmpty() ? list.get(0) : null;
    }

    private Integer extractFirstYear(Object obj) {
        if (obj instanceof List<?> list && !list.isEmpty()) {
            Object first = list.get(0);
            if (first instanceof Number n) return n.intValue();
            if (first instanceof String s) return parseYear(s);
        }
        return null;
    }

    private String findFirstIsbnByLength(List<String> isbns, int len) {
        if (isbns == null) return null;
        for (String isbn : isbns) {
            String norm = normalizeIsbn(isbn);
            if (norm != null && norm.length() == len) return norm;
        }
        return null;
    }

    private String cleanKey(String key) {
        if (key == null) return null;
        return key.replace("/books/", "")
            .replace("/authors/", "")
            .replace("/works/", "")
            .replace("/languages/", "")
            .trim();
    }

    private Integer parseYear(String publishDate) {
        if (publishDate == null || publishDate.isBlank()) return null;
        String digits = publishDate.replaceAll("\\D", "");
        if (digits.length() < 4) return null;
        try {
            return Integer.parseInt(digits.substring(0, 4));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer parseInteger(Object obj) {
        if (obj instanceof Number n) return n.intValue();
        if (obj instanceof String s) {
            try {
                return Integer.parseInt(s.trim());
            } catch (Exception ignored) {}
        }
        return null;
    }

    private record CoverInfo(
        String coverSmall,
        String coverMedium,
        String coverLarge,
        List<String> coverUrls
    ) {}
}
