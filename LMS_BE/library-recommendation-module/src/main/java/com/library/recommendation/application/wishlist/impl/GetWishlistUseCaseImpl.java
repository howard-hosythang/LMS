package com.library.recommendation.application.wishlist.impl;

import com.library.recommendation.application.wishlist.GetWishlistUseCase;
import com.library.recommendation.dto.WishlistItemResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GetWishlistUseCaseImpl implements GetWishlistUseCase {

    private final NamedParameterJdbcTemplate jdbc;

    private static final String SQL = """
        SELECT
            p.id            AS publication_id,
            p.title         AS title,
            p.cover_image_url AS cover_image_url,
            p.publication_year AS publication_year,
            STRING_AGG(DISTINCT a.name, ', ' ORDER BY a.name) AS author_names,
            COUNT(DISTINCT i.id) AS total_items,
            COUNT(DISTINCT CASE WHEN i.status = 'AVAILABLE' THEN i.id END) AS available_items,
            wli.added_at    AS added_at
        FROM wish_lists wl
        JOIN wish_lists_item wli ON wli.wish_list_id = wl.id
        JOIN publications p ON p.id = wli.publication_id
        LEFT JOIN items i ON i.publication_id = p.id
        LEFT JOIN publication_authors pa ON pa.publication_id = p.id
        LEFT JOIN authors a ON a.id = pa.author_id
        WHERE wl.user_id = :userId
        GROUP BY p.id, p.title, p.cover_image_url, p.publication_year, wli.added_at
        ORDER BY wli.added_at DESC
        """;

    @Override
    public List<WishlistItemResponse> execute(Long userId) {
        return jdbc.query(SQL,
            new MapSqlParameterSource("userId", userId),
            (rs, rowNum) -> new WishlistItemResponse(
                rs.getLong("publication_id"),
                rs.getString("title"),
                rs.getString("cover_image_url"),
                rs.getString("author_names"),
                rs.getObject("publication_year", Integer.class),
                rs.getInt("total_items"),
                rs.getInt("available_items"),
                rs.getTimestamp("added_at") != null
                    ? rs.getTimestamp("added_at").toInstant() : null
            )
        );
    }
}
