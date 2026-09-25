package com.library.catalog.dto.request.publication;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PublicSearchRequest {
    private String keyword;
    private Long categoryId;
    private List<Long> categoryIds;
    private String language;
    private Integer yearFrom;
    private Integer yearTo;
    private Boolean available;
    private String branch;
    private String sortBy;
    private Boolean titleOnly;
    private int page = 0;
    private int size = 12;
}
