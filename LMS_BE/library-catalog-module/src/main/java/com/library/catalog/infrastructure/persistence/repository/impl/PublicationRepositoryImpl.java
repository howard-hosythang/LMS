package com.library.catalog.infrastructure.persistence.repository.impl;

import com.library.catalog.domain.enums.FacultyTarget;
import com.library.catalog.domain.enums.PublicationFormat;
import com.library.catalog.application.i18n.MetadataLanguage;
import com.library.catalog.dto.response.author.AuthorOverviewResponse;
import com.library.catalog.dto.response.category.CategoryOverviewResponse;
import com.library.catalog.dto.response.item.ItemOverviewResponse;
import com.library.catalog.dto.response.publication.LibrarianPublicationListResponse;
import com.library.catalog.dto.response.publication.PublicationDetailResponse;
import com.library.catalog.dto.response.publication.PublicationResponse;
import com.library.catalog.dto.response.publisher.PublisherOverviewResponse;
import com.library.catalog.dto.response.tag.TagResponse;
import com.library.catalog.infrastructure.persistence.repository.PublicationRepositoryCustom;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

// PublicationRepositoryImpl.java
@Repository
@RequiredArgsConstructor
public class PublicationRepositoryImpl implements PublicationRepositoryCustom {

  private final EntityManager em;
  private final JdbcTemplate jdbc;

  @Override
  public Page<LibrarianPublicationListResponse> findPublicationsForLibrarian(
      String keyword, Long categoryId, Integer year, Boolean hasItems, Pageable pageable) {

    StringBuilder where = new StringBuilder("WHERE 1=1 ");
    Map<String, Object> params = new LinkedHashMap<>();

    if (keyword != null && !keyword.isBlank()) {
      where.append("AND LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) ");
      params.put("keyword", keyword);
    }
    if (categoryId != null) {
      where.append("AND pc.category_id = :categoryId ");
      params.put("categoryId", categoryId);
    }
    if (year != null) {
      where.append("AND p.publication_year = :year ");
      params.put("year", year);
    }
    if (Boolean.TRUE.equals(hasItems)) {
      where.append("AND EXISTS (SELECT 1 FROM items ii WHERE ii.publication_id = p.id) ");
    } else if (Boolean.FALSE.equals(hasItems)) {
      where.append("AND NOT EXISTS (SELECT 1 FROM items ii WHERE ii.publication_id = p.id) ");
    }

    String joins = """
        FROM publications p
        LEFT JOIN publication_authors pa    ON pa.publication_id = p.id
        LEFT JOIN authors a                 ON a.id = pa.author_id
        LEFT JOIN publication_categories pc ON pc.publication_id = p.id
        LEFT JOIN categories c              ON c.id = pc.category_id
        LEFT JOIN publishers pub            ON pub.id = p.publisher_id
        LEFT JOIN items i                   ON i.publication_id  = p.id
        LEFT JOIN ai_engine.publication_etl_runs etl ON etl.publication_id = p.id
        """;

    String dataSQL = "SELECT p.id, p.title, p.subtitle, p.cover_image_url, "
        + "p.publication_year, p.created_at, "
        + "STRING_AGG(DISTINCT a.name, ',') AS author_names, "
        + "COUNT(DISTINCT i.id) AS total_items, "
        + "p.isbn, "
        + "pub.name AS publisher_name, "
        + "STRING_AGG(DISTINCT c.name, ',') AS category_names, "
        + "COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'AVAILABLE') AS available_items, "
        + "COALESCE(etl.status, CASE WHEN p.file_url IS NULL THEN 'NOT_UPLOADED' ELSE 'NOT_STARTED' END) AS ai_processing_status, "
        + "etl.error_message AS ai_processing_error, "
        + "etl.updated_at AS ai_processed_at "
        + joins + where
        + "GROUP BY p.id, p.title, p.subtitle, p.cover_image_url, p.publication_year, p.created_at, p.isbn, pub.name, etl.status, etl.error_message, etl.updated_at";

    String countSQL = "SELECT COUNT(*) FROM (SELECT p.id " + joins + where + "GROUP BY p.id) sub";

    // Append Sorting
    String orderBy = "ORDER BY p.created_at DESC"; // default
    if (pageable.getSort().isSorted()) {
      StringBuilder sb = new StringBuilder("ORDER BY ");
      pageable.getSort().forEach(order -> {
        String property = order.getProperty();
        String direction = order.getDirection().name();
        String column = switch (property) {
          case "title" -> "p.title";
          case "publicationYear" -> "p.publication_year";
          case "createdAt" -> "p.created_at";
          case "id" -> "p.id";
          default -> "p.created_at";
        };
        sb.append(column).append(" ").append(direction).append(", ");
      });
      orderBy = sb.substring(0, sb.length() - 2);
    }

    dataSQL += " " + orderBy;

    Query dataQuery = em.createNativeQuery(dataSQL)
        .setFirstResult((int) pageable.getOffset())
        .setMaxResults(pageable.getPageSize());

    Query countQuery = em.createNativeQuery(countSQL);

    // bind chỉ những param thực sự có trong query
    params.forEach((k, v) -> {
      dataQuery.setParameter(k, v);
      countQuery.setParameter(k, v);
    });

    List<Object[]> rows = dataQuery.getResultList();
    long total = ((Number) countQuery.getSingleResult()).longValue();

    List<LibrarianPublicationListResponse> content = rows.stream()
        .map(this::mapRow)
        .toList();

    return new PageImpl<>(content, pageable, total);
  }

  @Override
  public Optional<PublicationDetailResponse> findPublicationDetailForLibrarian(Long id, String uiLanguage) {
    String language = MetadataLanguage.normalize(uiLanguage);

    // ── 1. Publication + Publisher ──────────────────────────────────────
    String pubSQL = """
        SELECT
            p.id, p.isbn,
            COALESCE(NULLIF(pt.title, ''), p.title) AS title,
            COALESCE(NULLIF(pt.subtitle, ''), p.subtitle) AS subtitle,
            COALESCE(NULLIF(pt.description, ''), p.description) AS description,
            p.language,
            p.number_of_pages,
            COALESCE(NULLIF(pt.ai_summary, ''), p.ai_summary) AS ai_summary,
            p.ai_target_audience, p.file_url,
            p.publication_year, p.edition, p.publication_format, p.edition_note,
            p.cover_image_url, p.size, p.weight,
            p.call_number,
            COALESCE(NULLIF(pt.table_of_contents, ''), p.table_of_contents) AS table_of_contents,
            (SELECT COUNT(*) FROM borrowing_transactions bt
             JOIN items bi ON bi.id = bt.item_id
             WHERE bi.publication_id = p.id) AS borrow_count,
            (SELECT COUNT(*) FROM user_interactions ui
             WHERE ui.publication_id = p.id AND ui.type = 'WATCH') AS view_count,
            COALESCE(etl.status, CASE WHEN p.file_url IS NULL THEN 'NOT_UPLOADED' ELSE 'NOT_STARTED' END) AS ai_processing_status,
            etl.error_message AS ai_processing_error,
            etl.chunks_count AS ai_chunks_count,
            etl.vectors_count AS ai_vectors_count,
            etl.updated_at AS ai_processed_at,
            pb.id   AS publisher_id,
            pb.name AS publisher_name
        FROM publications p
        LEFT JOIN publishers pb ON pb.id = p.publisher_id
        LEFT JOIN publication_translations pt ON pt.publication_id = p.id AND pt.language_code = ?
        LEFT JOIN ai_engine.publication_etl_runs etl ON etl.publication_id = p.id
        WHERE p.id = ?
        """;

    List<Map<String, Object>> pubRows = jdbc.queryForList(pubSQL, language, id);
      if (pubRows.isEmpty()) {
          return Optional.empty();
      }

    Map<String, Object> pub = pubRows.get(0);

    PublicationResponse publication = PublicationResponse.builder()
        .id(toLong(pub.get("id")))
        .isbn((String) pub.get("isbn"))
        .title((String) pub.get("title"))
        .subtitle((String) pub.get("subtitle"))
        .description((String) pub.get("description"))
        .language((String) pub.get("language"))
        .numberOfPages(toInt(pub.get("number_of_pages")))
        .aiSummary((String) pub.get("ai_summary"))
        .aiTargetAudience(toEnum(pub.get("ai_target_audience"), FacultyTarget.class))
        .fileUrl((String) pub.get("file_url"))
        .publicationYear(toInt(pub.get("publication_year")))
        .edition(toInt(pub.get("edition")))
        .publicationFormat(toEnum(pub.get("publication_format"), PublicationFormat.class))
        .editionNote((String) pub.get("edition_note"))
        .coverImageUrl((String) pub.get("cover_image_url"))
        .size((String) pub.get("size"))
        .weight(toDouble(pub.get("weight")))
        .callNumber((String) pub.get("call_number"))
        .tableOfContents((String) pub.get("table_of_contents"))
        .borrowCount(toLong(pub.get("borrow_count")))
        .viewCount(toLong(pub.get("view_count")))
        .aiProcessingStatus((String) pub.get("ai_processing_status"))
        .aiProcessingError((String) pub.get("ai_processing_error"))
        .aiChunksCount(toInt(pub.get("ai_chunks_count")))
        .aiVectorsCount(toInt(pub.get("ai_vectors_count")))
        .aiProcessedAt(toInstant(pub.get("ai_processed_at")))
        .build();

    PublisherOverviewResponse publisher = null;
    if (pub.get("publisher_id") != null) {
      publisher = PublisherOverviewResponse.builder()
          .id(toLong(pub.get("publisher_id")))
          .name((String) pub.get("publisher_name"))
          .build();
    }

    // ── 2. Authors ──────────────────────────────────────────────────────
    String authorSQL = """
        SELECT a.id, a.name
        FROM authors a
        JOIN publication_authors pa ON pa.author_id = a.id
        WHERE pa.publication_id = ?
        """;

    List<AuthorOverviewResponse> authors = jdbc.query(authorSQL,
        (rs, rowNum) -> AuthorOverviewResponse.builder()
            .id(rs.getLong("id"))
            .name(rs.getString("name"))
            .build(),
        id);

    // ── 3. Tags ─────────────────────────────────────────────────────────
    String tagSQL = """
        SELECT t.id, COALESCE(NULLIF(tt.name, ''), t.name) AS name
        FROM tags t
        JOIN publication_tags pt ON pt.tag_id = t.id
        LEFT JOIN tag_translations tt ON tt.tag_id = t.id AND tt.language_code = ?
        WHERE pt.publication_id = ?
        """;

    List<TagResponse> tags = jdbc.query(tagSQL,
        (rs, rowNum) -> TagResponse.builder()
            .id(rs.getLong("id"))
            .name(rs.getString("name"))
            .build(),
        language, id);

    // ── 4. Categories ───────────────────────────────────────────────────
    String categorySQL = """
        SELECT c.id, COALESCE(NULLIF(ct.name, ''), c.name) AS name
        FROM categories c
        JOIN publication_categories pc ON pc.category_id = c.id
        LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.language_code = ?
        WHERE pc.publication_id = ?
        """;

    List<CategoryOverviewResponse> categories = jdbc.query(categorySQL,
        (rs, rowNum) -> CategoryOverviewResponse.builder()
            .id(rs.getLong("id"))
            .name(rs.getString("name"))
            .build(),
        language, id);

    // ── 5. Ratings overview ─────────────────────────────────────────────
    String ratingSQL = """
        SELECT ROUND(AVG(star)::numeric, 1) AS average_rating,
               COUNT(*)                      AS total_ratings
        FROM ratings
        WHERE publication_id = ?
        """;

    PublicationDetailResponse.RatingOverviewResponse ratings = jdbc.queryForObject(ratingSQL,
        (rs, rowNum) -> PublicationDetailResponse.RatingOverviewResponse.builder()
            .averageRating(rs.getObject("average_rating") != null
                ? rs.getDouble("average_rating") : null)
            .totalRatings(rs.getInt("total_ratings"))
            .build(),
        id);

    // ── 6. Items overview ───────────────────────────────────────────────
    String itemSQL = """
        SELECT
            COUNT(*)                                           AS total_items,
            COUNT(*) FILTER (WHERE status = 'AVAILABLE')      AS total_available,
            COUNT(*) FILTER (WHERE status = 'BORROWED')       AS total_borrowed
        FROM items
        WHERE publication_id = ?
        """;

    ItemOverviewResponse items = jdbc.queryForObject(itemSQL,
        (rs, rowNum) -> ItemOverviewResponse.builder()
            .totalItems(rs.getInt("total_items"))
            .totalAvailableItems(rs.getInt("total_available"))
            .totalBorrowedItems(rs.getInt("total_borrowed"))
            .build(),
        id);

    return Optional.of(PublicationDetailResponse.builder()
        .publication(publication)
        .publisher(publisher)
        .authors(authors)
        .tags(tags)
        .categories(categories)
        .ratings(ratings)
        .items(items)
        .build());
  }

  private LibrarianPublicationListResponse mapRow(Object[] row) {
    Instant createdAt = null;
    if (row[5] != null) {
      if (row[5] instanceof java.time.OffsetDateTime odt) {
        createdAt = odt.toInstant();
      } else if (row[5] instanceof java.sql.Timestamp ts) {
        createdAt = ts.toInstant();
      } else if (row[5] instanceof Instant instant) {
        createdAt = instant;
      }
    }

    return LibrarianPublicationListResponse.builder()
        .publicationId(toLong(row[0]))
        .title((String) row[1])
        .subtitle((String) row[2])
        .coverImageUrl((String) row[3])
        .publicationYear(toInt(row[4]))
        .createdAt(createdAt)
        .authorNames(row[6] != null
            ? Arrays.asList(((String) row[6]).split(","))
            : List.of())
        .totalItems(toLong(row[7]))
        .isbn((String) row[8])
        .publisherName((String) row[9])
        .categoryNames((String) row[10])
        .availableItems(toLong(row[11]))
        .aiProcessingStatus((String) row[12])
        .aiProcessingError((String) row[13])
        .aiProcessedAt(toInstant(row[14]))
        .build();
  }

  private Long toLong(Object val) {
    return val instanceof Number n ? n.longValue() : null;
  }

  private Integer toInt(Object val) {
    return val instanceof Number n ? n.intValue() : null;
  }

  private Double toDouble(Object val) {
    return val instanceof Number n ? n.doubleValue() : null;
  }

  private Instant toInstant(Object val) {
    if (val instanceof java.time.OffsetDateTime odt) {
      return odt.toInstant();
    }
    if (val instanceof java.sql.Timestamp ts) {
      return ts.toInstant();
    }
    if (val instanceof Instant instant) {
      return instant;
    }
    return null;
  }

  private <E extends Enum<E>> E toEnum(Object val, Class<E> type) {
    return val instanceof String s ? Enum.valueOf(type, s) : null;
  }

}
