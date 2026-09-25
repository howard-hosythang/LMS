package com.library.catalog.dto.response.category;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryOverviewResponse {
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;
    private String name;
    private String bio;
    @JsonSerialize(using = ToStringSerializer.class)
    private Long parentCategoryId;
    private String parentCategoryName;
    private long publicationCount;
}
