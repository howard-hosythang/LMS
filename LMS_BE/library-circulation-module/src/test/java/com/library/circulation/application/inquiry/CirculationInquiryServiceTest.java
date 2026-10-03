package com.library.circulation.application.inquiry;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.library.circulation.application.transaction.GetAllBorrowingTransactionUseCase;
import com.library.shared.dto.PageResponse;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class CirculationInquiryServiceTest {
    @Mock NamedParameterJdbcTemplate jdbc;
    @Mock GetAllBorrowingTransactionUseCase transactions;
    @InjectMocks CirculationInquiryService service;

    @Test void emptySuggestionsDoNotScanAllReadersOrPublications() {
        assertThat(service.readers(" ")).isEmpty(); assertThat(service.publications(null, null)).isEmpty();
        verifyNoInteractions(jdbc);
    }

    @Test void invalidBranchCannotReachDatabase() {
        assertThatThrownBy(() -> service.publication(1L, "ALL", 0, 10)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(jdbc);
    }

    @Test void missingTransactionIsNotAnEmptySuccessfulDetail() {
        when(transactions.search(0, 1, null, null, null, null, null, null, null, "BORROWED", null, null, 9L, null))
            .thenReturn(PageResponse.<com.library.circulation.dto.response.TransactionListResponse>builder().content(List.of()).build());
        assertThatThrownBy(() -> service.transaction(9L)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(jdbc);
    }

    @Test void missingCopyCannotLookLikeAnEmptyTimeline() {
        when(jdbc.queryForList(anyString(), any(SqlParameterSource.class))).thenReturn(List.of());
        assertThatThrownBy(() -> service.timeline(9L, 0, 20)).isInstanceOf(ResponseStatusException.class);
    }

    @Test void timelineQueriesRealEventsWithPaginationNotCurrentConditionSnapshots() {
        when(jdbc.queryForList(anyString(), any(SqlParameterSource.class))).thenAnswer(invocation ->
            invocation.<String>getArgument(0).contains("WHERE i.id = :id") ? List.of(new java.util.HashMap<String, Object>(Map.of("itemId", "1"))) : List.of());
        when(jdbc.queryForObject(anyString(), any(SqlParameterSource.class), eq(Long.class))).thenReturn(43L);
        var result = service.timeline(1L, 1, 20);
        verify(jdbc).queryForList(contains("LIMIT :limit OFFSET :offset"), argThat((SqlParameterSource p) -> p.getValue("offset").equals(20L)));
        verify(jdbc).queryForList(contains("f.paid_by_librarian_id"), any(SqlParameterSource.class));
        assertThat(result.getTotalPages()).isEqualTo(3); assertThat(result.getCurrentPage()).isEqualTo(1);
    }
}
