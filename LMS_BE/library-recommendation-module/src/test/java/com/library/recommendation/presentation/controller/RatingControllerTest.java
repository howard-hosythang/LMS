package com.library.recommendation.presentation.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.recommendation.application.rating.CreatePublicationRatingUseCase;
import com.library.recommendation.application.rating.GetPublicationRatingSummaryUseCase;
import com.library.recommendation.application.rating.GetPublicationRatingsUseCase;
import com.library.recommendation.dto.request.CreatePublicationRatingRequest;
import com.library.recommendation.dto.response.PublicationRatingResponse;
import com.library.recommendation.dto.response.PublicationRatingSummaryResponse;
import com.library.shared.dto.PageResponse;
import com.library.shared.util.SecurityEvaluator;
import com.library.user.domain.enums.FacultyEnum;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

@ExtendWith(MockitoExtension.class)
@DisplayName("RatingController — MockMvc")
class RatingControllerTest {

    private static final Long USER_ID = 4L;
    private static final Long PUBLICATION_ID = 1L;

    @Mock GetPublicationRatingsUseCase getPublicationRatingsUseCase;
    @Mock CreatePublicationRatingUseCase createPublicationRatingUseCase;
    @Mock SecurityEvaluator securityEvaluator;
    @Mock GetPublicationRatingSummaryUseCase getPublicationRatingSummaryUseCase;
    @Mock JdbcTemplate jdbcTemplate;
    @Mock NamedParameterJdbcTemplate namedJdbcTemplate;
    @Mock KafkaTemplate<String, Object> kafkaTemplate;

    @InjectMocks RatingController controller;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setValidator(validator)
            .build();
    }

    @Test
    @DisplayName("GET /publications/{id}/ratings returns paginated ratings")
    void getPublicationRatings_shouldReturnPage() throws Exception {
        PublicationRatingResponse rating = PublicationRatingResponse.builder()
            .ratingId(99L)
            .star(5)
            .comment("Very useful")
            .helpfulCount(2)
            .fullName("Nguyen Van A")
            .studentId("2212345")
            .faculty(FacultyEnum.KHOA_KHOA_HOC_VA_KY_THUAT_MAY_TINH)
            .build();
        PageResponse<PublicationRatingResponse> page = PageResponse.<PublicationRatingResponse>builder()
            .content(List.of(rating))
            .currentPage(0)
            .pageSize(10)
            .totalElements(1)
            .totalPages(1)
            .isFirst(true)
            .isLast(true)
            .build();

        when(securityEvaluator.isAuthenticated()).thenReturn(false);
        when(getPublicationRatingsUseCase.execute(PUBLICATION_ID, 0, 10, null, "newest")).thenReturn(page);
        when(namedJdbcTemplate.query(anyString(), any(SqlParameterSource.class), any(ResultSetExtractor.class)))
            .thenReturn(java.util.Map.of());

        mockMvc.perform(get("/api/v1/publications/{publicationId}/ratings", PUBLICATION_ID))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Get publication ratings successful"))
            .andExpect(jsonPath("$.data.content[0].ratingId").value("99"))
            .andExpect(jsonPath("$.data.content[0].star").value(5));
    }

    @Test
    @DisplayName("POST /publications/{id}/ratings creates current-user rating")
    void createRating_shouldCallUseCaseWithCurrentUser() throws Exception {
        CreatePublicationRatingRequest request = CreatePublicationRatingRequest.builder()
            .star(5)
            .comment("Excellent book")
            .build();
        when(securityEvaluator.getCurrentUserId()).thenReturn(USER_ID);

        mockMvc.perform(post("/api/v1/publications/{publicationId}/ratings", PUBLICATION_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Create rating successful"));

        ArgumentCaptor<CreatePublicationRatingRequest> captor =
            ArgumentCaptor.forClass(CreatePublicationRatingRequest.class);
        verify(createPublicationRatingUseCase).execute(eq(PUBLICATION_ID), eq(USER_ID), captor.capture());
        org.assertj.core.api.Assertions.assertThat(captor.getValue().getStar()).isEqualTo(5);
    }

    @Test
    @DisplayName("POST /publications/{id}/ratings rejects invalid star")
    void createRating_shouldReturnBadRequest_whenStarOutOfRange() throws Exception {
        CreatePublicationRatingRequest request = CreatePublicationRatingRequest.builder()
            .star(6)
            .comment("Invalid")
            .build();

        mockMvc.perform(post("/api/v1/publications/{publicationId}/ratings", PUBLICATION_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /publications/{id}/ratings/summary returns rating summary")
    void getPublicationRatingSummary_shouldReturnSummary() throws Exception {
        PublicationRatingSummaryResponse summary = PublicationRatingSummaryResponse.builder()
            .fiveStarCount(7L)
            .fourStarCount(2L)
            .threeStarCount(1L)
            .twoStarCount(0L)
            .oneStarCount(0L)
            .totalCount(10L)
            .build();
        when(getPublicationRatingSummaryUseCase.execute(PUBLICATION_ID)).thenReturn(summary);

        mockMvc.perform(get("/api/v1/publications/{publicationId}/ratings/summary", PUBLICATION_ID))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Get publication rating summary successful"))
            .andExpect(jsonPath("$.data.totalCount").value(10))
            .andExpect(jsonPath("$.data.fiveStarCount").value(7));
    }
}
