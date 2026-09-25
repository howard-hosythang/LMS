package com.library.recommendation.dto.response;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RecommendationResponse {

    @JsonSerialize(using = ToStringSerializer.class)
    private Long publicationId;
    private String title;
    private String coverImageUrl;
    private Integer publicationYear;
    private Integer availableItems;
    private Double ratingAverage;
    private Integer ratingCount;
    private Long borrowCount;
    private List<String> authorNames;
}
