package com.library.circulation.infrastructure.service;

import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.NotificationMessage;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class WishlistAvailabilityNotificationService {

    private static final String AVAILABLE_COUNT_SQL = """
        SELECT COUNT(*)
        FROM items
        WHERE publication_id = :publicationId
          AND status = 'AVAILABLE'
        """;

    private static final String WISHLIST_WATCHERS_SQL = """
        SELECT DISTINCT wl.user_id
        FROM wish_lists wl
        JOIN wish_lists_item wli ON wli.wish_list_id = wl.id
        JOIN users u ON u.id = wl.user_id
        WHERE wli.publication_id = :publicationId
          AND u.status = 'ACTIVE'
          AND wl.user_id <> :returnedByUserId
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public boolean isOutOfStock(Long publicationId) {
        Integer availableCount = jdbcTemplate.queryForObject(
            AVAILABLE_COUNT_SQL,
            new MapSqlParameterSource("publicationId", publicationId),
            Integer.class
        );
        return availableCount == null || availableCount == 0;
    }

    public void notifyWishlistWatchers(Long publicationId, String publicationTitle, Long returnedByUserId) {
        List<Long> watcherIds = jdbcTemplate.queryForList(
            WISHLIST_WATCHERS_SQL,
            new MapSqlParameterSource()
                .addValue("publicationId", publicationId)
                .addValue("returnedByUserId", returnedByUserId),
            Long.class
        );

        for (Long watcherId : watcherIds) {
            kafkaTemplate.send(KafkaTopics.NOTIFICATION_SEND, new NotificationMessage(
                watcherId,
                "WISHLIST_BOOK_AVAILABLE",
                "Sách trong wishlist đã có sẵn",
                String.format("Cuốn \"%s\" bạn đang theo dõi đã có sẵn trên kệ, hãy đặt trước ngay!", publicationTitle),
                "/publicpage/book/" + publicationId,
                publicationId
            ));
        }

        if (!watcherIds.isEmpty()) {
            log.info("Queued wishlist availability notifications: publicationId={}, recipients={}",
                publicationId, watcherIds.size());
        }
    }
}
