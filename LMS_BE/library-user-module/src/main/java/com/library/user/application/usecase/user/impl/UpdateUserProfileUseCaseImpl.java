package com.library.user.application.usecase.user.impl;

import com.library.shared.exception.AppException;
import com.library.shared.exception.ErrorCode;
import com.library.user.application.dto.request.UpdateUserProfileCommand;
import com.library.user.application.dto.response.UserResponse;
import com.library.user.application.mapper.UserMapper;
import com.library.user.application.usecase.user.UpdateUserProfileUseCase;
import com.library.user.domain.entities.User;
import com.library.user.domain.repository.UserRepository;
import com.library.user.domain.valueobject.UserId;
import com.library.user.domain.valueobject.UserProfile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Slf4j
@Service
@RequiredArgsConstructor
public class UpdateUserProfileUseCaseImpl implements UpdateUserProfileUseCase {

  private final UserRepository userRepository;
  private final UserMapper userMapper;
  private final NamedParameterJdbcTemplate jdbcTemplate;

  @Override
  @Transactional
  public UserResponse execute(Long userId, UpdateUserProfileCommand request) {
    log.info("Updating profile for user ID: {}", userId);

    // Find user
    UserId id = UserId.of(userId);
    User user = userRepository.findById(id)
        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

    // get user profile currently
    UserProfile userProfile = user.getProfile();

    String phoneNumber = request.phoneNumber() == null ? null : request.phoneNumber().trim();
    if (phoneNumber != null && !phoneNumber.isBlank()) {
      Integer duplicates = jdbcTemplate.queryForObject(
          """
          SELECT COUNT(*)
          FROM users
          WHERE phone_number = :phoneNumber
            AND id <> :userId
          """,
          new MapSqlParameterSource()
              .addValue("phoneNumber", phoneNumber)
              .addValue("userId", userId),
          Integer.class
      );
      if (duplicates != null && duplicates > 0) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone number already exists");
      }
    }

    // Update profile
    UserProfile newProfile = userMapper.mergeAndMapToUserProfile(userProfile, request);
    user.updateProfile(newProfile);

    // Save user
    User updatedUser = userRepository.save(user);

    log.info("Successfully updated profile for user ID: {}", userId);

    return userMapper.toResponse(updatedUser);
  }
}
