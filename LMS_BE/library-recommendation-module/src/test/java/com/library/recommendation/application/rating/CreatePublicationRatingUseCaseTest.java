package com.library.recommendation.application.rating;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.library.recommendation.application.rating.impl.CreatePublicationRatingUseCaseImpl;
import com.library.recommendation.dto.request.CreatePublicationRatingRequest;
import com.library.recommendation.infrastructure.persistence.entity.RatingEntity;
import com.library.recommendation.infrastructure.persistence.repository.RatingJpaRepository;
import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.shared.service.LibrarianNotificationService;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

@ExtendWith(MockitoExtension.class)
@DisplayName("CreatePublicationRatingUseCase — Unit Tests")
class CreatePublicationRatingUseCaseTest {

  @Mock private RatingJpaRepository ratingJpaRepository;
  @Mock private JdbcTemplate jdbcTemplate;
  @Mock private LibrarianNotificationService librarianNotificationService;

  @InjectMocks private CreatePublicationRatingUseCaseImpl useCase;

  private static final Long USER_ID = 1001L;
  private static final Long PUBLICATION_ID = 3001L;

  @Test
  @DisplayName("Tạo đánh giá thành công khi user đã trả ấn phẩm")
  void createRatingSuccess_whenUserReturnedPublication() {
    CreatePublicationRatingRequest request = CreatePublicationRatingRequest.builder()
        .star(5)
        .comment("Very useful book")
        .build();
    mockEligibleTransaction(false, Instant.now());
    when(jdbcTemplate.queryForMap(anyString(), any(Object[].class))).thenReturn(Map.of(
        "full_name", "Nguyen Van A",
        "student_id", "2213001",
        "title", "Clean Code"
    ));

    useCase.execute(PUBLICATION_ID, USER_ID, request);

    ArgumentCaptor<RatingEntity> ratingCaptor = ArgumentCaptor.forClass(RatingEntity.class);
    verify(ratingJpaRepository).save(ratingCaptor.capture());
    RatingEntity saved = ratingCaptor.getValue();
    assertThat(saved.getId()).isNotNull();
    assertThat(saved.getUserId()).isEqualTo(USER_ID);
    assertThat(saved.getPublicationId()).isEqualTo(PUBLICATION_ID);
    assertThat(saved.getTransactionId()).isEqualTo(5001L);
    assertThat(saved.getItemBarcode()).isEqualTo("BC001");
    assertThat(saved.getStar()).isEqualTo(5);
    assertThat(saved.getComment()).isEqualTo("Very useful book");
    verify(jdbcTemplate).update("UPDATE users SET contribution_score = contribution_score + 5 WHERE id = ?", USER_ID);
  }

  @Test
  @DisplayName("Ném USER_NOT_BORROWED_PUBLICATION khi user chưa mượn sách")
  void throwNotBorrowed_whenUserHasNoCompletedBorrow() {
    CreatePublicationRatingRequest request = CreatePublicationRatingRequest.builder()
        .star(4)
        .comment("Good")
        .build();
    when(jdbcTemplate.queryForList(anyString(), any(Object[].class))).thenReturn(List.of());

    assertThatThrownBy(() -> useCase.execute(PUBLICATION_ID, USER_ID, request))
        .isInstanceOf(AppException.class)
        .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
            .isEqualTo(ErrorCode.USER_NOT_BORROWED_PUBLICATION));

    verify(ratingJpaRepository, never()).save(any());
  }

  @Test
  @DisplayName("Ném RATING_ALREADY_EXISTS khi user đánh giá trùng ấn phẩm")
  void throwRatingAlreadyExists_whenUniqueConstraintViolated() {
    CreatePublicationRatingRequest request = CreatePublicationRatingRequest.builder()
        .star(3)
        .comment("Duplicate")
        .build();
    mockEligibleTransaction(false, Instant.now());
    when(ratingJpaRepository.save(any(RatingEntity.class)))
        .thenThrow(new DataIntegrityViolationException("uk_rating_transaction"));

    assertThatThrownBy(() -> useCase.execute(PUBLICATION_ID, USER_ID, request))
        .isInstanceOf(AppException.class)
        .satisfies(ex -> assertThat(((AppException) ex).getErrorCode())
            .isEqualTo(ErrorCode.RATING_ALREADY_EXISTS));
  }

  private void mockEligibleTransaction(boolean reviewed, Instant returnedAt) {
    when(jdbcTemplate.queryForList(anyString(), any(Object[].class))).thenReturn(List.of(Map.of(
        "transaction_id", 5001L,
        "returned_date", Timestamp.from(returnedAt),
        "barcode", "BC001",
        "reviewed", reviewed
    )));
  }
}
