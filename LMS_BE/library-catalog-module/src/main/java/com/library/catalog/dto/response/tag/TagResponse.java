package com.library.catalog.dto.response.tag;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TagResponse {
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;
    private String name;
}
