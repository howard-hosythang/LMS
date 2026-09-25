package com.library.recommendation.domain.entity;

import com.library.user.domain.valueobject.SearchId;
import com.library.user.domain.valueobject.UserId;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class SearchHistory {
    private SearchId id;
    private UserId userId;
    private String searchQuery;
    private Instant createAt;

    public static SearchHistory create(SearchId id, UserId userId, String searchQuery, Instant timestamp) {
        return new SearchHistory(id, userId, searchQuery, timestamp);
    }
}
