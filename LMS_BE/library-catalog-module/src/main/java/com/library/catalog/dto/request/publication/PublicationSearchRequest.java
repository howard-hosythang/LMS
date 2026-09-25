package com.library.catalog.dto.request.publication;

import lombok.Data;

@Data
public class PublicationSearchRequest {
    private int page = 0;
    private int size = 20;
    private String keyword;
    private Long categoryId;
    private Integer year;
    private Boolean hasItems;
    private String sortBy = "createdAt";
    private String sortDir = "DESC";
}
