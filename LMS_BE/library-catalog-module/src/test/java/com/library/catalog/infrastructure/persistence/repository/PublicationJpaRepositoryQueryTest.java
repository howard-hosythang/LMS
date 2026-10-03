package com.library.catalog.infrastructure.persistence.repository;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import static org.assertj.core.api.Assertions.assertThat;

class PublicationJpaRepositoryQueryTest {
    @ParameterizedTest
    @ValueSource(strings = {"findMostBorrowedPublications", "findNewestPublications"})
    void availableCountUsesDistinctCopyIdsDespiteMultipleJoinedRatingsAndLoans(String method) throws Exception {
        String query = PublicationJpaRepository.class.getMethod(method, Pageable.class)
            .getAnnotation(Query.class).value().replaceAll("\\s+", " ");
        // Count copy IDs, not joined rows or distinct 0/1 values; NULL excludes unavailable copies.
        assertThat(query).contains("COUNT(DISTINCT CASE WHEN i.status = 'AVAILABLE' THEN i.id ELSE NULL END) AS availableItems")
            .doesNotContain("SUM(CASE WHEN i.status");
        assertThat(query).contains("COUNT(DISTINCT r.id) AS ratingCount", "COUNT(DISTINCT bt.id) AS borrowCount");
    }
}
