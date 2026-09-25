package com.library.circulation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReaderActivityTimelineResponse {

  @JsonSerialize(using = ToStringSerializer.class)
  private Long id;
  private String type;
  private String title;
  private String description;
  private Instant occurredAt;
  private BigDecimal amount;
}
