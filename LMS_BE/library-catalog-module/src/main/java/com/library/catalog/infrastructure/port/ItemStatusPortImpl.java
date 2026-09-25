package com.library.catalog.infrastructure.port;

import com.library.shared.port.ItemSnapshot;
import com.library.shared.port.ItemStatusPort;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ItemStatusPortImpl implements ItemStatusPort {

    private static final String LOCK_SQL = """
        SELECT i.id, i.status, i.publication_id, i.barcode, i.branch, i.location,
               p.title AS publication_title
        FROM items i
        JOIN publications p ON p.id = i.publication_id
        WHERE i.id = :itemId
        FOR UPDATE
        """;

    private static final String LOCK_BY_BARCODE_SQL = """
        SELECT i.id, i.status, i.publication_id, i.barcode, i.branch, i.location,
               p.title AS publication_title
        FROM items i
        JOIN publications p ON p.id = i.publication_id
        WHERE i.barcode = :barcode
        FOR UPDATE
        """;

    private static final String UPDATE_SQL = """
        UPDATE items SET status = :status, updated_at = NOW()
        WHERE id = :itemId
        """;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    public ItemSnapshot lockAndGet(Long itemId) {
        var rows = jdbcTemplate.queryForList(LOCK_SQL, Map.of("itemId", itemId));
        if (rows.isEmpty()) throw new AppException(ErrorCode.ITEM_NOT_FOUND);
        var row = rows.get(0);
        return new ItemSnapshot(
            ((Number) row.get("id")).longValue(),
            (String) row.get("status"),
            ((Number) row.get("publication_id")).longValue(),
            (String) row.get("publication_title"),
            (String) row.get("barcode"),
            (String) row.get("branch"),
            (String) row.get("location")
        );
    }

    @Override
    public ItemSnapshot lockAndGetByBarcode(String barcode) {
        var rows = jdbcTemplate.queryForList(LOCK_BY_BARCODE_SQL, Map.of("barcode", barcode));
        if (rows.isEmpty()) throw new AppException(ErrorCode.ITEM_NOT_FOUND);
        var row = rows.get(0);
        return new ItemSnapshot(
            ((Number) row.get("id")).longValue(),
            (String) row.get("status"),
            ((Number) row.get("publication_id")).longValue(),
            (String) row.get("publication_title"),
            (String) row.get("barcode"),
            (String) row.get("branch"),
            (String) row.get("location")
        );
    }

    @Override
    public void updateStatus(Long itemId, String status) {
        jdbcTemplate.update(UPDATE_SQL,
            new MapSqlParameterSource("status", status).addValue("itemId", itemId));
    }
}
