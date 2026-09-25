package com.library.catalog.application.impl;

import com.library.catalog.application.GetMostBorrowedPublicationsUseCase;
import com.library.catalog.application.i18n.MetadataLanguage;
import com.library.catalog.dto.projection.AuthorNameProjection;
import com.library.catalog.dto.projection.MostBorrowedPublicationProjection;
import com.library.catalog.dto.response.publication.MostBorrowedPublicationsResponse;
import com.library.catalog.infrastructure.persistence.repository.PublicationJpaRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetMostBorrowedPublicationsUseCaseImpl implements GetMostBorrowedPublicationsUseCase {

  private final PublicationJpaRepository publicationJpaRepository;
  private final NamedParameterJdbcTemplate jdbc;

  @Override
  public List<MostBorrowedPublicationsResponse> execute(int limit, String uiLanguage) {
    Pageable pageable = PageRequest.of(0, limit);
    List<MostBorrowedPublicationProjection> projections = publicationJpaRepository.findMostBorrowedPublications(
        pageable);
    
    List<Long> ids = projections.stream().map(MostBorrowedPublicationProjection::getPublicationId)
        .toList();

    if (ids.isEmpty()) {
      return List.of();
    }

    Map<Long, List<String>> authorsByPubId = publicationJpaRepository
        .findAuthorNamesByPublicationIds(ids)
        .stream()
        .collect(Collectors.groupingBy(
            AuthorNameProjection::getPublicationId,
            Collectors.mapping(AuthorNameProjection::getAuthorName, Collectors.toList())
        ));

    Map<Long, String> titlesByPubId = localizedTitles(ids, uiLanguage);

    return projections.stream().map(projection ->
        MostBorrowedPublicationsResponse.builder()
            .publicationId(projection.getPublicationId())
            .title(titlesByPubId.getOrDefault(projection.getPublicationId(), projection.getTitle()))
            .coverImageUrl(projection.getCoverImageUrl())
            .publicationYear(projection.getPublicationYear())
            .createdAt(projection.getCreatedAt())
            .availableItems(projection.getAvailableItems())
            .authorNames(authorsByPubId.getOrDefault(projection.getPublicationId(), List.of()))
            .ratingAverage(projection.getRatingAverage() != null ? projection.getRatingAverage().doubleValue() : null)
            .ratingCount(projection.getRatingCount())
            .borrowCount(projection.getBorrowCount())
            .build()).toList();
  }

  private Map<Long, String> localizedTitles(List<Long> ids, String uiLanguage) {
    if (ids.isEmpty()) {
      return Map.of();
    }

    String sql = """
        SELECT p.id, COALESCE(NULLIF(pt.title, ''), p.title) AS title
        FROM publications p
        LEFT JOIN publication_translations pt ON pt.publication_id = p.id AND pt.language_code = :uiLanguage
        WHERE p.id IN (:ids)
        """;
    MapSqlParameterSource params = new MapSqlParameterSource()
        .addValue("ids", ids)
        .addValue("uiLanguage", MetadataLanguage.normalize(uiLanguage));
    return jdbc.query(sql, params, rs -> {
      Map<Long, String> result = new java.util.HashMap<>();
      while (rs.next()) {
        result.put(rs.getLong("id"), rs.getString("title"));
      }
      return result;
    });
  }
}
