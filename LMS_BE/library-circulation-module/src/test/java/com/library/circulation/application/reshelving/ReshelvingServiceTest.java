package com.library.circulation.application.reshelving;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import com.library.shared.exception.AppException;
import com.library.shared.service.AuditLogService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;

@ExtendWith(MockitoExtension.class)
class ReshelvingServiceTest {
    @Mock NamedParameterJdbcTemplate jdbc;
    @Mock AuditLogService audit;
    @InjectMocks ReshelvingService service;

    @Test void confirmsOnlySelectedWaitingCopiesAndAuditsActualUpdates() {
        when(jdbc.queryForList(contains("ORDER BY id FOR UPDATE"), anyMap())).thenReturn(List.of());
        when(jdbc.queryForList(contains("RETURNING q.id"), anyMap(), eq(Long.class))).thenReturn(List.of(1L));
        var result = service.confirm(List.of(2L, 1L, 1L), 7L, "Cơ sở 1 - Lý Thường Kiệt");
        assertThat(result).containsEntry("updatedCount", 1).containsEntry("skippedCount", 1);
        var order = inOrder(jdbc);
        order.verify(jdbc).queryForList(contains("ORDER BY id FOR UPDATE"), eq(Map.of("ids", List.of(1L, 2L), "librarianId", 7L, "branch", "Cơ sở 1 - Lý Thường Kiệt")));
        order.verify(jdbc).queryForList(contains("q.status = 'WAITING'"), anyMap(), eq(Long.class));
        verify(audit).log(eq(7L), eq("LIBRARIAN"), eq("CONFIRM_RESHELVING"), anyString(), isNull(), anyString(),
            eq(Map.of("taskIds", List.of(1L), "count", 1, "branch", "Cơ sở 1 - Lý Thường Kiệt")));
    }

    @Test void repeatOrStaleConfirmationIsIdempotent() {
        when(jdbc.queryForList(contains("ORDER BY id FOR UPDATE"), anyMap())).thenReturn(List.of());
        when(jdbc.queryForList(contains("RETURNING q.id"), anyMap(), eq(Long.class))).thenReturn(List.of());
        assertThat(service.confirm(List.of(1L), 7L, "Cơ sở 1 - Lý Thường Kiệt")).containsEntry("updatedCount", 0).containsEntry("skippedCount", 1);
        verifyNoInteractions(audit);
    }

    @Test void invalidEmptySelectionIsRejected() {
        assertThatThrownBy(() -> service.confirm(List.of(), 7L, "Cơ sở 1 - Lý Thường Kiệt")).isInstanceOf(AppException.class);
        verifyNoInteractions(jdbc, audit);
    }

    @ParameterizedTest @ValueSource(longs = {-1, 0})
    void rejectsInvalidIds(long id) {
        assertThatThrownBy(() -> service.confirm(List.of(id), 7L, "Cơ sở 1 - Lý Thường Kiệt")).isInstanceOf(AppException.class);
        verifyNoInteractions(jdbc, audit);
    }

    @ParameterizedTest @ValueSource(booleans = {true, false})
    void normalReturnQueuesButReservedReturnDoesNot(boolean reserved) {
        service.recordReturn(5L, reserved);
        verify(jdbc).update(contains("i.status = 'AVAILABLE'"), eq(Map.of("id", 5L, "required", !reserved)));
    }

    @Test void countUsesOnlyReturnedAvailableWaitingCopies() {
        when(jdbc.queryForObject(contains("i.status = 'AVAILABLE'"), any(SqlParameterSource.class), eq(Long.class))).thenReturn(12L);
        assertThat(service.countWaiting()).isEqualTo(12);
    }

    @ParameterizedTest @ValueSource(strings = {"PICKUP_EXPIRED", "RESERVATION_EXPIRED", "RESERVATION_CANCELLED", "LOST_RECOVERED"})
    void queuesAvailableCopyWithRealSourceAndIdempotentInsert(String name) {
        var source = ReshelvingService.Source.valueOf(name);
        boolean reservation = name.startsWith("RESERVATION");
        service.recordAvailable(1L, reservation ? null : 10L, reservation ? 20L : null, 7L, source);
        verify(jdbc).update(contains("ON CONFLICT DO NOTHING"), argThat((SqlParameterSource params) ->
            params.getValue("source").equals(name) && params.getValue("itemId").equals(1L)));
    }

    @Test void invalidSourceCannotManufactureAReturn() {
        assertThatThrownBy(() -> service.recordAvailable(1L, null, 20L, 7L, ReshelvingService.Source.RETURN))
            .isInstanceOf(AppException.class);
        verifyNoInteractions(jdbc);
    }

    @Test void confirmationScopesBothLocksAndUpdatesToSelectedBranch() {
        when(jdbc.queryForList(contains("ORDER BY id FOR UPDATE"), anyMap())).thenReturn(List.of());
        when(jdbc.queryForList(contains("RETURNING q.id"), anyMap(), eq(Long.class))).thenReturn(List.of());
        service.confirm(List.of(1L, 2L), 7L, "Cơ sở 2 - Dĩ An");
        verify(jdbc).queryForList(contains("AND branch = :branch"), argThat((Map<String, ?> p) -> "Cơ sở 2 - Dĩ An".equals(p.get("branch"))));
        verify(jdbc).queryForList(contains("AND i.branch = :branch"), anyMap(), eq(Long.class));
        verifyNoInteractions(audit);
    }

    @ParameterizedTest @ValueSource(strings = {"ALL", "", "CS1", "invalid"})
    void confirmationRejectsNonConcreteBranches(String branch) {
        assertThatThrownBy(() -> service.confirm(List.of(1L), 7L, branch)).isInstanceOf(AppException.class);
        verifyNoInteractions(jdbc, audit);
    }

    @Test void defaultBranchUsesAuthenticatedLibrarianCampus() {
        when(jdbc.queryForList(anyString(), eq(Map.of("id", 7L)), eq(String.class))).thenReturn(List.of("CAMPUS_2"));
        assertThat(service.getDefaultBranch(7L)).isEqualTo("Cơ sở 2 - Dĩ An");
    }
}
