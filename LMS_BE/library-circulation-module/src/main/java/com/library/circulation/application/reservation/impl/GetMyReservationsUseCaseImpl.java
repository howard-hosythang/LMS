package com.library.circulation.application.reservation.impl;

import com.library.circulation.application.reservation.GetMyReservationsUseCase;
import com.library.circulation.domain.enums.ReservationStatus;
import com.library.circulation.dto.response.ReservationResponse;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GetMyReservationsUseCaseImpl implements GetMyReservationsUseCase {

    private static final String QUERY_SQL = """
        SELECT r.id, r.publication_id, p.title AS publication_title, p.cover_image_url,
               r.preferred_branch, r.status, r.queue_position,
               r.hold_expiration_time, r.reservation_date,
               r.assigned_item_id, i.barcode AS assigned_barcode,
               i.branch AS assigned_branch, i.location AS assigned_location
        FROM reservations r
        JOIN publications p ON p.id = r.publication_id
        LEFT JOIN items i ON i.id = r.assigned_item_id
        WHERE r.user_id = :userId
        ORDER BY r.reservation_date DESC
        LIMIT :limit OFFSET :offset
        """;

    private static final String COUNT_SQL = """
        SELECT COUNT(*) FROM reservations WHERE user_id = :userId
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    @Transactional(readOnly = true)
    public Page<ReservationResponse> execute(Long userId, Pageable pageable) {
        Long total = jdbcTemplate.queryForObject(COUNT_SQL, Map.of("userId", userId), Long.class);
        if (total == null || total == 0) return Page.empty(pageable);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(QUERY_SQL,
            Map.of("userId", userId, "limit", pageable.getPageSize(), "offset", pageable.getOffset()));

        List<ReservationResponse> content = rows.stream().map(this::mapRow).toList();
        return new PageImpl<>(content, pageable, total);
    }

    private ReservationResponse mapRow(Map<String, Object> row) {
        Long assignedItemId = row.get("assigned_item_id") != null
            ? ((Number) row.get("assigned_item_id")).longValue() : null;

        return ReservationResponse.builder()
            .reservationId(((Number) row.get("id")).longValue())
            .publicationId(((Number) row.get("publication_id")).longValue())
            .publicationTitle((String) row.get("publication_title"))
            .coverImageUrl((String) row.get("cover_image_url"))
            .preferredBranch((String) row.get("preferred_branch"))
            .status(ReservationStatus.valueOf((String) row.get("status")))
            .queuePosition(((Number) row.get("queue_position")).intValue())
            .assignedItemId(assignedItemId)
            .assignedBarcode((String) row.get("assigned_barcode"))
            .assignedBranch((String) row.get("assigned_branch"))
            .assignedLocation((String) row.get("assigned_location"))
            .holdExpirationTime(toInstant(row.get("hold_expiration_time")))
            .reservationDate(toInstant(row.get("reservation_date")))
            .build();
    }

    private Instant toInstant(Object val) {
        if (val == null) return null;
        if (val instanceof Timestamp ts) return ts.toInstant();
        return null;
    }
}
