package com.library.circulation.application.reservation.impl;

import com.library.catalog.domain.valueobject.PublicationId;
import com.library.circulation.application.policy.CirculationPolicy;
import com.library.circulation.application.policy.CirculationPolicyService;
import com.library.circulation.application.reservation.CreateReservationUseCase;
import com.library.circulation.domain.entities.Reservation;
import com.library.circulation.domain.enums.ReservationStatus;
import com.library.circulation.dto.request.CreateReservationCommand;
import com.library.circulation.dto.response.ReservationResponse;
import com.library.circulation.infrastructure.persistence.entity.ReservationEntity;
import com.library.circulation.infrastructure.persistence.repository.ReservationJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.kafka.KafkaTopics;
import com.library.shared.kafka.event.NotificationMessage;
import com.library.user.domain.valueobject.UserId;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CreateReservationUseCaseImpl implements CreateReservationUseCase {

    private static final String CHECK_EXISTING_SQL = """
        SELECT COUNT(*) FROM reservations
        WHERE user_id = :userId
          AND publication_id = :publicationId
          AND status IN ('PENDING', 'READY_FOR_PICKUP')
        """;

    private static final String CHECK_ACTIVE_RESERVATIONS_COUNT_SQL = """
        SELECT COUNT(*) FROM reservations
        WHERE user_id = :userId
          AND status IN ('PENDING', 'READY_FOR_PICKUP')
        """;

    private static final String CHECK_UNPAID_FINES_SQL = """
        SELECT COUNT(*) FROM fines f
        JOIN borrowing_transactions bt ON f.transaction_id = bt.id
        WHERE bt.user_id = :userId
          AND f.payment_status = 'UNPAID'
        """;

    private static final String CHECK_AVAILABLE_ITEM_SQL = """
        SELECT COUNT(*) FROM items
        WHERE publication_id = :publicationId
          AND status = 'AVAILABLE'
          AND (:branch = 'ANY' OR branch = :branch)
        """;

    private static final String CHECK_BRANCH_HAS_ITEMS_SQL = """
        SELECT COUNT(*) FROM items
        WHERE publication_id = :publicationId
          AND branch = :branch
        """;

    private static final String NEXT_QUEUE_POSITION_SQL = """
        SELECT COALESCE(MAX(queue_position), 0) + 1
        FROM reservations
        WHERE publication_id = :publicationId
          AND status = 'PENDING'
        """;

    private final ReservationJpaRepository reservationJpaRepository;
    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final CirculationPolicyService policyService;

    @Override
    @Transactional
    public ReservationResponse execute(Long userId, CreateReservationCommand command) {
        Long publicationId = command.publicationId();
        CirculationPolicy policy = policyService.getPolicy();
        String branch = command.preferredBranch() != null && !command.preferredBranch().isBlank()
            ? command.preferredBranch().trim() : "ANY";

        // Check for unpaid fines
        if (Boolean.TRUE.equals(policy.blockBorrowWhenUnpaidFines())) {
            Long unpaidFines = jdbcTemplate.queryForObject(CHECK_UNPAID_FINES_SQL,
                Map.of("userId", userId), Long.class);
            if (unpaidFines != null && unpaidFines > 0) {
                throw new AppException(ErrorCode.USER_HAS_UNPAID_FINES);
            }
        }

        // Check active reservations count (max 2)
        Long activeCount = jdbcTemplate.queryForObject(CHECK_ACTIVE_RESERVATIONS_COUNT_SQL,
            Map.of("userId", userId), Long.class);
        if (activeCount != null && activeCount >= policy.maxActiveReservations()) {
            throw new AppException(ErrorCode.RESERVATION_LIMIT_EXCEEDED);
        }

        // No active reservation for this publication
        Long existing = jdbcTemplate.queryForObject(CHECK_EXISTING_SQL,
            Map.of("userId", userId, "publicationId", publicationId), Long.class);
        if (existing != null && existing > 0) {
            throw new AppException(ErrorCode.RESERVATION_ALREADY_EXISTS);
        }

        // Check if branch has any items at all (if not ANY)
        if (!"ANY".equals(branch)) {
            Long branchItemCount = jdbcTemplate.queryForObject(CHECK_BRANCH_HAS_ITEMS_SQL,
                Map.of("publicationId", publicationId, "branch", branch), Long.class);
            if (branchItemCount == null || branchItemCount == 0) {
                throw new AppException(ErrorCode.RESERVATION_BRANCH_NO_ITEMS);
            }
        }

        // Block if item is available — user should borrow directly
        Long availableCount = jdbcTemplate.queryForObject(CHECK_AVAILABLE_ITEM_SQL,
            Map.of("publicationId", publicationId, "branch", branch), Long.class);
        if (availableCount != null && availableCount > 0) {
            throw new AppException(ErrorCode.RESERVATION_BOOK_AVAILABLE);
        }

        // Queue position
        Integer queuePosition = jdbcTemplate.queryForObject(NEXT_QUEUE_POSITION_SQL,
            Map.of("publicationId", publicationId), Integer.class);
        if (queuePosition == null) queuePosition = 1;

        Reservation reservation = Reservation.create(
            UserId.of(userId), PublicationId.of(publicationId), branch, queuePosition);

        ReservationEntity entity = toEntity(reservation);
        reservationJpaRepository.save(entity);

        kafkaTemplate.send(KafkaTopics.NOTIFICATION_SEND, new NotificationMessage(
            userId, "BOOK_RESERVED",
            "Đặt trước sách thành công",
            String.format("Bạn đang ở vị trí %d trong hàng chờ. Chúng tôi sẽ thông báo khi sách sẵn sàng.", queuePosition),
            "/userpage/reservations?highlight=" + entity.getId(), entity.getId()
        ));

        log.info("Reservation created: id={}, userId={}, publicationId={}, queue={}",
            entity.getId(), userId, publicationId, queuePosition);

        return toResponse(entity, null, null, null, null, null, null);
    }

    private ReservationEntity toEntity(Reservation domain) {
        ReservationEntity e = ReservationEntity.builder()
            .userId(domain.getUserId().getValue())
            .publicationId(domain.getPublicationId().getValue())
            .preferredBranch(domain.getPreferredBranch())
            .reservationDate(domain.getReservationDate())
            .status(domain.getStatus())
            .queuePosition(domain.getQueuePosition())
            .build();
        e.setId(domain.getId().getValue());
        return e;
    }

    static ReservationResponse toResponse(
        ReservationEntity e,
        String publicationTitle,
        String coverImageUrl,
        String assignedBarcode,
        String assignedBranch,
        String assignedLocation,
        Long assignedItemId) {
        return ReservationResponse.builder()
            .reservationId(e.getId())
            .publicationId(e.getPublicationId())
            .publicationTitle(publicationTitle)
            .coverImageUrl(coverImageUrl)
            .preferredBranch(e.getPreferredBranch())
            .status(e.getStatus())
            .queuePosition(e.getQueuePosition())
            .assignedItemId(assignedItemId)
            .assignedBarcode(assignedBarcode)
            .assignedBranch(assignedBranch)
            .assignedLocation(assignedLocation)
            .holdExpirationTime(e.getHoldExpirationTime())
            .reservationDate(e.getReservationDate())
            .build();
    }
}
