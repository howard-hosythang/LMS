package com.library.circulation.application.inquiry;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.library.circulation.application.transaction.impl.GetAllBorrowingTransactionUseCaseImpl;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class TransactionInquiryQueryTest {
    @Mock NamedParameterJdbcTemplate jdbc;

    @Test void returnedDateRangeUsesVietnamMidnightAndExactReaderWithStablePaging() {
        when(jdbc.query(anyString(), any(SqlParameterSource.class), any(RowMapper.class))).thenReturn(List.of());
        when(jdbc.queryForObject(anyString(), any(SqlParameterSource.class), eq(Long.class))).thenReturn(32L);
        var service = new GetAllBorrowingTransactionUseCaseImpl(jdbc);
        var result = service.search(2, 15, "Java", null, "UNPAID", "2026-10-01", "2026-10-03", "returnedDate", "DESC", "RETURNED", 7L, null, null, "RETURNED");
        var sql = ArgumentCaptor.forClass(String.class);
        var params = ArgumentCaptor.forClass(SqlParameterSource.class);
        verify(jdbc).query(sql.capture(), params.capture(), any(RowMapper.class));
        assertThat(sql.getValue()).contains("LEFT JOIN publications p", "STRING_AGG(a.name", "LOWER(p.title)", "t.returned_date >= :dateFrom", "t.returned_date < :dateTo", "t.user_id = :userId", "t.status = 'RETURNED'", "NULLS LAST, t.id DESC", "LIMIT :limit OFFSET :offset");
        assertThat(sql.getValue()).doesNotContain("t.borrowed_date >= :dateFrom");
        assertThat(params.getValue().getValue("userId")).isEqualTo(7L);
        assertThat(params.getValue().getValue("offset")).isEqualTo(30L);
        assertThat(params.getValue().getValue("dateFrom")).isEqualTo(Timestamp.from(Instant.parse("2026-09-30T17:00:00Z")));
        assertThat(params.getValue().getValue("dateTo")).isEqualTo(Timestamp.from(Instant.parse("2026-10-03T17:00:00Z")));
        assertThat(result.getTotalElements()).isEqualTo(32);
        assertThat(result.getTotalPages()).isEqualTo(3);
    }

    @ParameterizedTest @ValueSource(strings = {"CREATED", "returned_date;DROP TABLE users", ""})
    void rejectsInvalidDateTypeBeforeQuery(String type) {
        assertThatThrownBy(() -> new GetAllBorrowingTransactionUseCaseImpl(jdbc).search(0, 15, null, null, null, null, null, null, null, type, null, null, null, null)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(jdbc);
    }

    @Test void invalidDateAndReversedRangeAreBadRequests() {
        var service = new GetAllBorrowingTransactionUseCaseImpl(jdbc);
        assertThatThrownBy(() -> service.execute(0, 15, null, null, null, "invalid", null, null, null)).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> service.execute(0, 15, null, null, null, "2026-10-04", "2026-10-01", null, null)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(jdbc);
    }

    @Test void legacyEndpointDefaultsToBorrowedDateAndLimitsPageSize() {
        when(jdbc.query(anyString(), any(SqlParameterSource.class), any(RowMapper.class))).thenReturn(List.of());
        when(jdbc.queryForObject(anyString(), any(SqlParameterSource.class), eq(Long.class))).thenReturn(0L);
        var result = new GetAllBorrowingTransactionUseCaseImpl(jdbc).execute(-1, 1000, null, null, null, "2026-10-01", null, null, null);
        verify(jdbc).query(contains("t.borrowed_date >= :dateFrom"), any(SqlParameterSource.class), any(RowMapper.class));
        assertThat(result.getCurrentPage()).isZero(); assertThat(result.getPageSize()).isEqualTo(100);
    }
}
