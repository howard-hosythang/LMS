package com.library.catalog.application.impl;

import com.library.catalog.application.GetPublicTestimonialsUseCase;
import com.library.catalog.dto.response.publication.PublicTestimonialResponse;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetPublicTestimonialsUseCaseImpl implements GetPublicTestimonialsUseCase {

  private final NamedParameterJdbcTemplate jdbcTemplate;

  private static final String TESTIMONIALS_SQL = """
      SELECT
          id AS rating_id,
          rating AS star,
          comment,
          reviewer_name AS full_name,
          reviewer_role,
          profile_picture_url
      FROM system_reviews
      WHERE is_published = TRUE
        AND comment IS NOT NULL
        AND LENGTH(TRIM(comment)) > 0
      ORDER BY rating DESC, created_at DESC
      LIMIT :limit
      """;

  @Override
  @Transactional(readOnly = true)
  public List<PublicTestimonialResponse> execute(int limit) {
    int safeLimit = Math.max(1, Math.min(limit, 12));
    return jdbcTemplate.query(TESTIMONIALS_SQL, new MapSqlParameterSource(Map.of("limit", safeLimit)),
        (rs, rowNum) -> PublicTestimonialResponse.builder()
            .ratingId(rs.getLong("rating_id"))
            .star(rs.getInt("star"))
            .comment(rs.getString("comment"))
            .fullName(rs.getString("full_name"))
            .role(rs.getString("reviewer_role"))
            .profilePictureUrl(rs.getString("profile_picture_url"))
            .publicationId(null)
            .publicationTitle("SmartLibrary")
            .build()
    );
  }
}
