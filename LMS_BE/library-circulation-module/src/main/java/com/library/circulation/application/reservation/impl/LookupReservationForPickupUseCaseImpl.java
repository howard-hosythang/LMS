package com.library.circulation.application.reservation.impl;

import com.library.circulation.application.reservation.LookupReservationForPickupUseCase;
import com.library.circulation.domain.enums.ReservationStatus;
import com.library.circulation.dto.response.LookupReservationResponse;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LookupReservationForPickupUseCaseImpl implements LookupReservationForPickupUseCase {

    private static final String BY_RESERVATION_ID_SQL = """
        SELECT r.id AS reservation_id, r.user_id, r.assigned_item_id, r.hold_expiration_time, r.status,
               u.student_id, u.full_name,
               i.barcode, i.branch, i.location, i.publication_id,
               p.title AS publication_title
        FROM reservations r
        JOIN users u        ON u.id = r.user_id
        JOIN items i        ON i.id = r.assigned_item_id
        JOIN publications p ON p.id = i.publication_id
        WHERE r.id = :reservationId
          AND r.status = 'READY_FOR_PICKUP'
        """;

    private static final String BY_STUDENT_AND_BARCODE_SQL = """
        SELECT r.id AS reservation_id, r.user_id, r.assigned_item_id, r.hold_expiration_time, r.status,
               u.student_id, u.full_name,
               i.barcode, i.branch, i.location, i.publication_id,
               p.title AS publication_title
        FROM reservations r
        JOIN users u        ON u.id = r.user_id
        JOIN items i        ON i.id = r.assigned_item_id
        JOIN publications p ON p.id = i.publication_id
        WHERE u.student_id = :studentId
          AND i.barcode    = :barcode
          AND r.status     = 'READY_FOR_PICKUP'
        ORDER BY r.created_at DESC
        LIMIT 1
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    @Transactional(readOnly = true)
    public LookupReservationResponse execute(Long reservationId, String studentId, String barcode) {
        List<Map<String, Object>> rows;

        if (reservationId != null) {
            rows = jdbcTemplate.queryForList(BY_RESERVATION_ID_SQL,
                Map.of("reservationId", reservationId));
        } else if (studentId != null && barcode != null) {
            MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("studentId", studentId)
                .addValue("barcode", barcode);
            rows = jdbcTemplate.queryForList(BY_STUDENT_AND_BARCODE_SQL, params);
        } else {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.RESERVATION_NOT_FOUND);
        }

        Map<String, Object> row = rows.get(0);
        return LookupReservationResponse.builder()
            .reservationId(((Number) row.get("reservation_id")).longValue())
            .userId(((Number) row.get("user_id")).longValue())
            .studentId((String) row.get("student_id"))
            .fullName((String) row.get("full_name"))
            .itemId(((Number) row.get("assigned_item_id")).longValue())
            .barcode((String) row.get("barcode"))
            .publicationId(((Number) row.get("publication_id")).longValue())
            .publicationTitle((String) row.get("publication_title"))
            .branch((String) row.get("branch"))
            .location((String) row.get("location"))
            .holdExpirationTime(row.get("hold_expiration_time") != null
                ? ((java.sql.Timestamp) row.get("hold_expiration_time")).toInstant() : null)
            .status(ReservationStatus.valueOf((String) row.get("status")))
            .build();
    }
}
