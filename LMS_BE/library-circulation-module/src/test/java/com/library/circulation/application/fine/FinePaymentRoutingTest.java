package com.library.circulation.application.fine;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.circulation.application.fine.impl.FinePaymentServiceImpl;
import com.library.circulation.infrastructure.payment.PayOsClient;
import com.library.shared.service.AuditLogService;
import com.library.shared.service.LibrarianNotificationService;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;

class FinePaymentRoutingTest {
    @Test void newPayOsFineOrderReturnsToBrowserCirculationRoute() {
        var jdbc = mock(NamedParameterJdbcTemplate.class);
        var client = mock(PayOsClient.class);
        var service = new FinePaymentServiceImpl(jdbc, client, new ObjectMapper(), mock(KafkaTemplate.class),
            mock(AuditLogService.class), mock(LibrarianNotificationService.class));
        ReflectionTestUtils.setField(service, "frontendUrl", "https://library74.uk");
        when(jdbc.queryForList(anyString(), anyMap())).thenReturn(List.of(Map.of(
            "fine_id", 1L, "user_id", 7L, "full_name", "Reader", "fine_amount", new BigDecimal("50000"))));
        when(jdbc.queryForList(anyString(), any(MapSqlParameterSource.class))).thenReturn(List.of());
        when(client.createPaymentLink(anyLong(), eq(50000), anyString(), eq("Reader"), eq(1), anyString(), anyString()))
            .thenReturn(new PayOsClient.PayOsPaymentLink("link", "https://pay.payos.vn/link", "qr"));

        var response = service.createPayOsPaymentLink("00123", 9L);

        assertThat(response).isNotNull();
        verify(client).createPaymentLink(anyLong(), eq(50000), anyString(), eq("Reader"), eq(1),
            eq("https://library74.uk/librarianpage/circulation?payment=cancelled"),
            eq("https://library74.uk/librarianpage/circulation?payment=success"));
    }
}
