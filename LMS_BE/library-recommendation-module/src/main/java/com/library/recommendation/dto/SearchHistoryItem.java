package com.library.recommendation.dto;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;

public record SearchHistoryItem(
    @JsonSerialize(using = ToStringSerializer.class) Long id,
    String keyword
) {}
