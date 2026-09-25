package com.library.recommendation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RatingReplyResponse {

  @JsonSerialize(using = ToStringSerializer.class)
  private Long replyId;

  private String content;
  private String librarianName;
  private String librarianAvatarUrl;
  private String librarianRoleLabel;
  private Instant createdAt;
}
