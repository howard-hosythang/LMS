package com.library.catalog.application;

import com.library.catalog.dto.response.publisher.PublisherOverviewResponse;
import java.util.List;

public interface SearchPublisherUseCase {
    List<PublisherOverviewResponse> execute(String keyword);
}
