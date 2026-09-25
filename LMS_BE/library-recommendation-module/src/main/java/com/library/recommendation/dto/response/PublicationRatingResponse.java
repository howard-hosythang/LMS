package com.library.recommendation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.library.user.domain.enums.FacultyEnum;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicationRatingResponse {

  @JsonSerialize(using = ToStringSerializer.class)
  private Long ratingId;
  @JsonSerialize(using = ToStringSerializer.class)
  private Long userId;
  @JsonSerialize(using = ToStringSerializer.class)
  private Long transactionId;
  private String itemBarcode;
  private int star;
  private String comment;
  private int helpfulCount;

  private String fullName;
  private String profilePictureUrl;
  private String studentId;
  private FacultyEnum faculty;
  private Instant createdAt;
  private Instant editableUntil;
  private boolean editableByCurrentUser = false;
  @Builder.Default
  private boolean helpfulByCurrentUser = false;
  @Builder.Default
  private List<RatingReplyResponse> replies = new ArrayList<>();

  public PublicationRatingResponse(Long ratingId, Long userId, Long transactionId, String itemBarcode,
      int star, String comment, int helpfulCount,
      String fullName, String profilePictureUrl, String studentId, FacultyEnum faculty, Instant createdAt) {
    this.ratingId = ratingId;
    this.userId = userId;
    this.transactionId = transactionId;
    this.itemBarcode = itemBarcode;
    this.star = star;
    this.comment = comment;
    this.helpfulCount = helpfulCount;
    this.fullName = fullName;
    this.profilePictureUrl = profilePictureUrl;
    this.studentId = studentId;
    this.faculty = faculty;
    this.createdAt = createdAt;
    this.editableUntil = createdAt != null ? createdAt.plus(java.time.Duration.ofDays(7)) : null;
    this.helpfulByCurrentUser = false;
    this.replies = new ArrayList<>();
  }

  public String getFaculty() {
    return faculty != null ? faculty.getName() : null;
  }
}
