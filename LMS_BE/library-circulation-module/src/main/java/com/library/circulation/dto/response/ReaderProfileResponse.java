package com.library.circulation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReaderProfileResponse {

  @JsonSerialize(using = ToStringSerializer.class)
  private Long userId;
  private String studentId;
  private String fullName;
  private String email;
  private String phoneNumber;
  private String profilePictureUrl;
  private String faculty;
  private String facultyDisplayName;
  private String major;
  private Integer activeBorrows;
  private Integer borrowLimit;
  private BigDecimal unpaidFineAmount;
  private Integer creditScore;
  private Boolean borrowingBlocked;
  private Long totalBorrowed;
  private Long returnedCount;
  private Long overdueCount;
  private Long fineCount;
  private Long unpaidFineCount;
  private Long damagedFineCount;
  private Long lostFineCount;
  private BigDecimal totalFineAmount;
  private BigDecimal paidFineAmount;
}
