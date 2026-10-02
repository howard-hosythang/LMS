package com.library.circulation.application.transaction;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.library.circulation.application.policy.CirculationPolicy;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.application.transaction.impl.GetStudentActiveTransactionsUseCaseImpl;
import com.library.circulation.domain.enums.PaymentStatus;
import com.library.circulation.domain.enums.ReservationStatus;
import com.library.circulation.infrastructure.persistence.repository.FineJpaRepository;
import com.library.circulation.infrastructure.persistence.repository.ReservationJpaRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

@ExtendWith(MockitoExtension.class)
class GetStudentActiveTransactionsUseCaseTest {
    @Mock NamedParameterJdbcTemplate jdbc;
    @Mock CirculationPolicyService policyService;
    @Mock ReservationJpaRepository reservationRepository;
    @Mock FineJpaRepository fineRepository;
    @InjectMocks GetStudentActiveTransactionsUseCaseImpl useCase;

    private void setup(List<Map<String, Object>> items) {
        when(jdbc.queryForList(contains("SELECT id, full_name"), anyMap()))
            .thenReturn(List.of(Map.of("id", 4L, "full_name", "Reader")));
        when(jdbc.queryForList(contains("t.id AS transaction_id"), anyMap())).thenReturn(items);
        when(policyService.getPolicy()).thenReturn(new CirculationPolicy(
            48, 14, 5, 2, 2, 3, new BigDecimal("1000"), BigDecimal.ZERO, true, null, null, null));
    }

    private Map<String, Object> row(String status, Integer dueOffset, int count) {
        var row = new HashMap<String, Object>();
        row.put("transaction_id", 1L);
        row.put("publication_id", 10L);
        row.put("publication_title", "Book");
        row.put("status", status);
        row.put("renewal_count", count);
        row.put("due_date", dueOffset == null ? null : java.sql.Date.valueOf(
            LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).plusDays(dueOffset)));
        return row;
    }

    @ParameterizedTest
    @CsvSource({
        "BORROWING, 3, 0, false, false, OK",
        "BORROWING, 0, 1, false, false, OK",
        "BORROWING, -1, 0, false, false, Sách đã quá hạn",
        "OVERDUE, 1, 0, false, false, Sách đã quá hạn",
        "BORROWING, 1, 2, false, false, Đã hết lượt gia hạn (2/2)",
        "BORROWING, 4, 0, false, false, chỉ mở trước hạn 3 ngày",
        "BORROWING, 1, 0, true, false, Ấn phẩm đang có người đặt trước",
        "BORROWING, 1, 0, false, true, Độc giả còn tiền phạt chưa thanh toán"
    })
    void exposesCurrentEligibilityAndSpecificReason(String status, int dueOffset, int count,
        boolean reservations, boolean fines, String reason) {
        setup(List.of(row(status, dueOffset, count)));
        when(fineRepository.existsByUserIdAndPaymentStatus(4L, PaymentStatus.UNPAID)).thenReturn(fines);
        if (status.equals("BORROWING") && dueOffset >= 0 && dueOffset <= 3 && count < 2) {
            when(reservationRepository.countByPublicationIdAndStatus(10L, ReservationStatus.PENDING))
                .thenReturn(reservations ? 1L : 0L);
        }
        var item = useCase.execute("2213214").getItems().get(0);
        assertThat(item.getRenewalCount()).isEqualTo(count);
        assertThat(item.getMaxRenewals()).isEqualTo(2);
        assertThat(item.getCanRenew()).isEqualTo(reason.equals("OK"));
        if (reason.equals("OK")) assertThat(item.getCannotRenewReason()).isNull();
        else assertThat(item.getCannotRenewReason()).contains(reason);
    }

    @Test void missingDueDateCannotRenew() {
        setup(List.of(row("BORROWING", null, 0)));
        var item = useCase.execute("2213214").getItems().get(0);
        assertThat(item.getCanRenew()).isFalse();
        assertThat(item.getCannotRenewReason()).contains("chưa có hạn trả");
    }

    @Test void cachesReservationCheckForMultipleCopiesOfOnePublication() {
        setup(List.of(row("BORROWING", 1, 0), row("BORROWING", 1, 0)));
        assertThat(useCase.execute("2213214").getItems()).allMatch(item -> item.getCanRenew());
        verify(reservationRepository, times(1)).countByPublicationIdAndStatus(10L, ReservationStatus.PENDING);
        verify(fineRepository, times(1)).existsByUserIdAndPaymentStatus(4L, PaymentStatus.UNPAID);
    }
}
