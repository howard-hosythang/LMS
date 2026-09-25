package com.library.user.presentation.controller;

import com.library.shared.dto.ApiResponseApp;
import com.library.shared.util.RequiresAuthentication;
import com.library.shared.util.SecurityEvaluator;
import com.library.user.application.dto.request.ChangePasswordRequest;
import com.library.user.application.dto.request.UpdateUserProfileCommand;
import com.library.user.application.dto.response.UserResponse;
import com.library.user.application.usecase.user.ChangePasswordUseCase;
import com.library.user.application.usecase.user.GetUserByIdUseCase;
import com.library.user.application.usecase.user.UpdateUserProfileUseCase;
import com.library.user.application.usecase.user.UploadAvatarUseCase;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;


@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

  private final GetUserByIdUseCase getUserByIdUseCase;
  private final UpdateUserProfileUseCase updateUserProfileUseCase;
  private final UploadAvatarUseCase uploadAvatarUseCase;
  private final ChangePasswordUseCase changePasswordUseCase;
  private final SecurityEvaluator security;
  private final NamedParameterJdbcTemplate jdbcTemplate;

  public record ExchangeContributionResponse(
      int creditScore,
      int contributionScore,
      int exchangedCredit,
      int spentContribution
  ) {
  }

  @GetMapping("/my-profile")
  @RequiresAuthentication()
  @Operation(summary = "Get current user profile")
  public ApiResponseApp<UserResponse> getUserById() {
    Long userId = security.getCurrentUserId();
    UserResponse response = getUserByIdUseCase.execute(userId);
    return ApiResponseApp.success(response);
  }

  @PutMapping("/my-profile")
  @RequiresAuthentication()
  @Operation(summary = "Update current user profile")
  @ResponseStatus(HttpStatus.OK)
  public ApiResponseApp<UserResponse> updateUserProfile(
      @Valid @RequestBody UpdateUserProfileCommand request) {
    Long id = security.getCurrentUserId();
    log.info("REST request to update profile for user ID: {}", id);
    UserResponse response = updateUserProfileUseCase.execute(id, request);
    return ApiResponseApp.success(response);
  }

  @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @RequiresAuthentication
  @Operation(summary = "Upload or update avatar")
  public ApiResponseApp<UserResponse> uploadAvatar(
      @RequestParam("file") MultipartFile file) {
    Long userId = security.getCurrentUserId();
    return ApiResponseApp.success(uploadAvatarUseCase.execute(userId, file));
  }

  @PutMapping("/my-profile/change-password")
  @Operation(summary = "Change current user password")
  @RequiresAuthentication()
  @ResponseStatus(HttpStatus.OK)
  public ApiResponseApp<Void> changePassword(
      @Valid @RequestBody ChangePasswordRequest request) {
    Long userId = security.getCurrentUserId();
    log.info("REST request to change password for user ID: {}", userId);
    changePasswordUseCase.execute(request, userId);
    return ApiResponseApp.success("Change password successfully");
  }

  @PostMapping("/my-profile/exchange-contribution")
  @Operation(summary = "Exchange contribution points for credit score")
  @RequiresAuthentication()
  public ApiResponseApp<ExchangeContributionResponse> exchangeContributionScore() {
    Long userId = security.getCurrentUserId();
    MapSqlParameterSource params = new MapSqlParameterSource("userId", userId);
    java.util.Map<String, Object> row = jdbcTemplate.queryForMap(
        """
        SELECT COALESCE(credit_score, 100) AS credit_score,
               COALESCE(contribution_score, 0) AS contribution_score
        FROM users
        WHERE id = :userId
        """,
        params
    );
    int creditScore = ((Number) row.get("credit_score")).intValue();
    int contributionScore = ((Number) row.get("contribution_score")).intValue();
    int missingCredit = Math.max(0, 100 - creditScore);
    int exchangedCredit = Math.min(missingCredit, contributionScore / 20);
    int spentContribution = exchangedCredit * 20;

    if (exchangedCredit > 0) {
      jdbcTemplate.update(
          """
          UPDATE users
          SET credit_score = LEAST(100, COALESCE(credit_score, 100) + :exchangedCredit),
              contribution_score = GREATEST(0, COALESCE(contribution_score, 0) - :spentContribution)
          WHERE id = :userId
          """,
          params
              .addValue("exchangedCredit", exchangedCredit)
              .addValue("spentContribution", spentContribution)
      );
    }

    return ApiResponseApp.success("Exchange contribution score successful",
        new ExchangeContributionResponse(
            Math.min(100, creditScore + exchangedCredit),
            Math.max(0, contributionScore - spentContribution),
            exchangedCredit,
            spentContribution
        ));
  }
}
