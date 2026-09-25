package com.library.circulation.application.reservation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.library.circulation.application.policy.CirculationPolicy;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.application.reservation.impl.CreateReservationUseCaseImpl;
import com.library.circulation.domain.enums.ReservationStatus;
import com.library.circulation.dto.request.CreateReservationCommand;
import com.library.circulation.dto.response.ReservationResponse;
import com.library.circulation.infrastructure.persistence.entity.ReservationEntity;
import com.library.circulation.infrastructure.persistence.repository.ReservationJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;

@ExtendWith(MockitoExtension.class)
@DisplayName("CreateReservationUseCase — Unit Tests")
class CreateReservationUseCaseTest {

    @Mock private ReservationJpaRepository reservationJpaRepository;
    @Mock private NamedParameterJdbcTemplate jdbcTemplate;
    @Mock private KafkaTemplate<String, Object> kafkaTemplate;
    @Mock private CirculationPolicyService policyService;

    @InjectMocks private CreateReservationUseCaseImpl useCase;

    private static final Long USER_ID = 1001L;
    private static final Long PUBLICATION_ID = 3001L;
    private static final String BRANCH = "Cơ sở 1 - Lý Thường Kiệt";

    @BeforeEach
    void setUp() {
        when(policyService.getPolicy()).thenReturn(defaultPolicy());
    }

    private CirculationPolicy defaultPolicy() {
        return new CirculationPolicy(
            48,
            14,
            5,
            2,
            new BigDecimal("1000"),
            true,
            null,
            null,
            Instant.now()
        );
    }

    /**
     * Stub các jdbcTemplate call theo thứ tự:
     * 1. CHECK_UNPAID_FINES_SQL      → unpaidFines
     * 2. CHECK_ACTIVE_RESERVATIONS   → activeCount
     * 3. CHECK_EXISTING_SQL          → existing
     * 4. CHECK_BRANCH_HAS_ITEMS_SQL  → branchItemCount  (chỉ khi branch != ANY)
     * 5. CHECK_AVAILABLE_ITEM_SQL    → availableCount
     * 6. NEXT_QUEUE_POSITION_SQL     → queuePosition
     */
    private void stubJdbc(Long unpaidFines, Long activeCount, Long existing,
                          Long branchItems, Long availableCount, Integer queuePos) {
        when(jdbcTemplate.queryForObject(anyString(), any(Map.class), any(Class.class)))
            .thenReturn(unpaidFines)
            .thenReturn(activeCount)
            .thenReturn(existing)
            .thenReturn(branchItems)
            .thenReturn(availableCount)
            .thenReturn(queuePos);
    }

    @Test
    @DisplayName("Tạo đặt trước thành công khi không có ràng buộc vi phạm")
    void createReservation_success() {
        // Given: không nợ, chưa đặt 2 cái, chưa đặt trước publication này,
        //        branch có sách nhưng không có AVAILABLE
        stubJdbc(0L, 0L, 0L, 5L, 0L, 1);
        when(reservationJpaRepository.save(any(ReservationEntity.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        // When
        ReservationResponse result = useCase.execute(USER_ID,
            new CreateReservationCommand(PUBLICATION_ID, BRANCH));

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(ReservationStatus.PENDING);
        assertThat(result.getQueuePosition()).isEqualTo(1);
        assertThat(result.getPreferredBranch()).isEqualTo(BRANCH);
        verify(reservationJpaRepository).save(any(ReservationEntity.class));
    }

    @Test
    @DisplayName("Ném RESERVATION_BOOK_AVAILABLE khi sách đang có bản AVAILABLE — nên mượn trực tiếp")
    void throwException_whenBookAvailable() {
        // Given: sách có bản AVAILABLE → không cần đặt trước
        stubJdbc(0L, 0L, 0L, 5L, 2L, 1); // availableCount = 2

        // When & Then
        assertThatThrownBy(() -> useCase.execute(USER_ID,
            new CreateReservationCommand(PUBLICATION_ID, BRANCH)))
            .isInstanceOf(AppException.class)
            .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.RESERVATION_BOOK_AVAILABLE));

        verify(reservationJpaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ném RESERVATION_LIMIT_EXCEEDED khi user đã có 2 đặt trước đang hoạt động")
    void throwException_whenLimitExceeded() {
        // Given: đã có 2 đặt trước active
        stubJdbc(0L, 2L, 0L, 5L, 0L, 1); // activeCount = 2

        // When & Then
        assertThatThrownBy(() -> useCase.execute(USER_ID,
            new CreateReservationCommand(PUBLICATION_ID, BRANCH)))
            .isInstanceOf(AppException.class)
            .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.RESERVATION_LIMIT_EXCEEDED));

        verify(reservationJpaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ném USER_HAS_UNPAID_FINES khi user còn nợ phí phạt")
    void throwException_whenUnpaidFines() {
        // Given: có 1 khoản phí chưa trả
        stubJdbc(1L, 0L, 0L, 5L, 0L, 1); // unpaidFines = 1

        // When & Then
        assertThatThrownBy(() -> useCase.execute(USER_ID,
            new CreateReservationCommand(PUBLICATION_ID, BRANCH)))
            .isInstanceOf(AppException.class)
            .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.USER_HAS_UNPAID_FINES));
    }

    @Test
    @DisplayName("Ném RESERVATION_ALREADY_EXISTS khi user đã đặt trước publication này")
    void throwException_whenAlreadyReserved() {
        // Given: đã có reservation active cho cùng publication
        stubJdbc(0L, 0L, 1L, 5L, 0L, 1); // existing = 1

        // When & Then
        assertThatThrownBy(() -> useCase.execute(USER_ID,
            new CreateReservationCommand(PUBLICATION_ID, BRANCH)))
            .isInstanceOf(AppException.class)
            .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
                .isEqualTo(ErrorCode.RESERVATION_ALREADY_EXISTS));
    }
}
