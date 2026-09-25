package com.library.catalog.dto.response.publication;

import com.library.catalog.domain.enums.FacultyTarget;
import com.library.catalog.dto.response.author.AuthorOverviewResponse;
import com.library.catalog.dto.response.category.CategoryOverviewResponse;
import com.library.catalog.dto.response.publisher.PublisherOverviewResponse;
import com.library.catalog.dto.response.tag.TagResponse;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UpdatePublicationResponse {
    private String title;
    private String subtitle;
    private String description;
    private String language;
    private Integer numberOfPages;
    private Integer publicationYear;
    private Integer edition;
    private String size;
    private Double weight;
    private FacultyTarget aiTargetAudience;
    private PublisherOverviewResponse publisher;
    private List<AuthorOverviewResponse> authors;
    private List<TagResponse> tags;
    private List<CategoryOverviewResponse> categories;
}
